import { prisma } from "@/lib/prisma";
import { saveDocImage } from "@/lib/doc-images";

// Reads a *public* notion.site workspace through the same unauthenticated endpoints the site's own
// pages use (unofficial — may change). It only follows pages the current page actually OWNS
// (parent chain), never linked/menu databases, otherwise every page's "Menu" pulls in the whole
// workspace.
const HOST = "https://v4-company.notion.site";
const API = `${HOST}/api/v3`;
const SPACE_ID = "ec6b8025-97f3-412f-b271-b090ce65d3ea";
const ROOT = {
  collectionId: "f71edc19-ec9e-4bfa-85eb-fc19c4289c55",
  viewId: "0e50c8dd-3864-41fc-b137-74e58d785bbd",
  url: `${HOST}/ee9c92ab9862434faf1f54ab75bf7d9d`,
};

type RichText = [string, [string, ...unknown[]][]?][];
type Block = {
  id: string;
  type: string;
  properties?: Record<string, RichText>;
  content?: string[];
  parent_id?: string;
  format?: Record<string, unknown>;
  view_ids?: string[];
  collection_id?: string;
};
type Collection = { parent_id?: string; schema?: Record<string, { name: string; type: string }> };
type PageData = { blocks: Record<string, Block>; collections: Record<string, Collection> };

export type ImportReport = {
  mode: "dry-run" | "import";
  pages: number;
  created: number;
  updated: number;
  skippedEdited: number;
  imagesFound: number;
  imagesSaved: number;
  imagesFailed: number;
  blockTypes: Record<string, number>;
  unsupportedTypes: Record<string, number>;
  skippedLinkedDatabases: number;
  truncated: boolean;
  warnings: string[];
};

export type ImportOptions = {
  mode: "dry-run" | "import";
  maxPages?: number;
  /** Only categories whose title contains this text (case-insensitive) — used to import one at a time. */
  only?: string;
  onProgress?: (r: ImportReport) => Promise<void> | void;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const val = (b: unknown): Block | undefined => {
  const x = b as { value?: { value?: Block } & Block } | undefined;
  return x?.value?.value ?? (x?.value as Block | undefined);
};

async function post(path: string, body: unknown): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) await sleep(1500 * (attempt + 1));
      else throw new Error(`Notion respondeu ${res.status} em ${path}`);
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1000 * (attempt + 1));
    }
  }
  throw new Error(`Falha ao chamar ${path}`);
}

async function loadPage(id: string): Promise<PageData> {
  const blocks: Record<string, Block> = {};
  const collections: Record<string, Collection> = {};
  let cursor: unknown = { stack: [] };
  for (let i = 0; i < 40; i++) {
    const res = await post("/loadCachedPageChunkV2", { page: { id }, limit: 200, cursor, verticalColumns: false });
    for (const [bid, b] of Object.entries(res.recordMap?.block ?? {})) {
      const v = val(b);
      if (v) blocks[bid] = v;
    }
    for (const [cid, c] of Object.entries(res.recordMap?.collection ?? {})) {
      const v = (c as { value?: { value?: Collection } & Collection }).value;
      collections[cid] = (v?.value ?? v) as Collection;
    }
    const next = res.cursor ?? res.cursors?.[0];
    if (!next?.stack?.length) break;
    cursor = next;
    await sleep(120);
  }
  // Some nested children aren't included in the chunks — fetch whatever content ids are missing.
  const missing = new Set<string>();
  for (const b of Object.values(blocks)) for (const c of b.content ?? []) if (!blocks[c]) missing.add(c);
  const ids = [...missing];
  for (let i = 0; i < ids.length; i += 100) {
    const res = await post("/getRecordValues", { requests: ids.slice(i, i + 100).map((mid) => ({ table: "block", id: mid })) });
    for (const r of res.results ?? []) {
      const v = val(r);
      if (v?.id) blocks[v.id] = v;
    }
    await sleep(120);
  }
  return { blocks, collections };
}

async function queryRows(collectionId: string, viewId: string): Promise<{ ids: string[]; collection?: Collection }> {
  const res = await post("/queryCollection", {
    collection: { id: collectionId, spaceId: SPACE_ID },
    collectionView: { id: viewId, spaceId: SPACE_ID },
    loader: { type: "reducer", reducers: { collection_group_results: { type: "results", limit: 300 } }, searchQuery: "", userTimeZone: "America/Sao_Paulo" },
  });
  const c = (res.recordMap?.collection?.[collectionId] as { value?: { value?: Collection } & Collection } | undefined)?.value;
  return { ids: res.result?.reducerResults?.collection_group_results?.blockIds ?? [], collection: (c?.value ?? c) as Collection | undefined };
}

const plain = (rt?: RichText) => (rt ?? []).map((s) => s[0]).join("");
const dashless = (id: string) => id.replace(/-/g, "");

function inline(rt?: RichText): string {
  return (rt ?? [])
    .map(([text, ann]) => {
      let t = text;
      const lead = t.match(/^\s*/)?.[0] ?? "";
      const trail = t.match(/\s*$/)?.[0] ?? "";
      let core = t.trim();
      if (!core) return t;
      for (const a of ann ?? []) {
        const [k, arg] = a as [string, unknown];
        if (k === "c") core = `\`${core}\``;
        else if (k === "b") core = `**${core}**`;
        else if (k === "i") core = `*${core}*`;
        else if (k === "s") core = `~~${core}~~`;
        else if (k === "a") core = `[${core}](${String(arg).startsWith("/") ? HOST + arg : arg})`;
        else if (k === "p") core = `[${core === "‣" ? "página" : core}](notion-page:${arg})`;
      }
      return lead + core + trail;
    })
    .join("");
}

type Ctx = {
  data: PageData;
  report: ImportReport;
  mode: "dry-run" | "import";
  registerChild: (blockId: string, isRow: boolean) => void;
};

const SIMPLE_TYPES = new Set([
  "text", "header", "sub_header", "sub_sub_header", "bulleted_list", "numbered_list", "to_do", "toggle", "quote", "callout",
  "code", "divider", "image", "video", "embed", "bookmark", "drive", "file", "pdf", "audio", "column_list", "column", "table",
  "table_row", "page", "collection_view", "collection_view_page", "equation",
]);

async function renderImage(b: Block, ctx: Ctx): Promise<string> {
  const src = plain(b.properties?.source) || String(b.format?.display_source ?? "");
  if (!src) return "";
  const caption = plain(b.properties?.caption);
  ctx.report.imagesFound++;
  if (ctx.mode === "dry-run") return `![${caption}](${src})`;
  try {
    const url = src.startsWith("http") && !src.includes("amazonaws.com") && !src.includes("notion")
      ? src
      : `${HOST}/image/${encodeURIComponent(src)}?table=block&id=${b.id}&spaceId=${SPACE_ID}&cache=v2`;
    const res = await fetch(url);
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) throw new Error(`HTTP ${res.status}`);
    const file = await saveDocImage(Buffer.from(await res.arrayBuffer()), res.headers.get("content-type") ?? "image/png");
    ctx.report.imagesSaved++;
    return `![${caption}](/api/materiais/docs/img/${file})`;
  } catch (err) {
    ctx.report.imagesFailed++;
    ctx.report.warnings.push(`Imagem não copiada (${b.id}): ${(err as Error).message}`);
    return `[imagem](${src})`;
  }
}

async function renderBlocks(ids: string[], ctx: Ctx, indent = ""): Promise<string> {
  const out: string[] = [];
  let counter = 0;
  for (const id of ids) {
    const b = ctx.data.blocks[id];
    if (!b) continue;
    ctx.report.blockTypes[b.type] = (ctx.report.blockTypes[b.type] ?? 0) + 1;
    counter = b.type === "numbered_list" ? counter + 1 : 0;
    const text = inline(b.properties?.title);
    const kids = b.content ?? [];
    const nested = async () => (await renderBlocks(kids, ctx, indent + "  ")).replace(/\n+$/, "");
    switch (b.type) {
      case "text": out.push(text ? `${indent}${text}\n\n` : "\n"); if (kids.length) out.push((await renderBlocks(kids, ctx, indent)) ); break;
      case "header": out.push(`${indent}# ${text}\n\n`); break;
      case "sub_header": out.push(`${indent}## ${text}\n\n`); break;
      case "sub_sub_header": out.push(`${indent}### ${text}\n\n`); break;
      case "bulleted_list": out.push(`${indent}- ${text}\n${kids.length ? (await nested()) + "\n" : ""}`); break;
      case "numbered_list": out.push(`${indent}${counter}. ${text}\n${kids.length ? (await nested()) + "\n" : ""}`); break;
      case "to_do": out.push(`${indent}- [${plain(b.properties?.checked) === "Yes" ? "x" : " "}] ${text}\n`); break;
      case "toggle": out.push(`\n<details>\n<summary>${plain(b.properties?.title)}</summary>\n\n${(await renderBlocks(kids, ctx)).trim()}\n\n</details>\n\n`); break;
      case "quote": out.push(`${indent}> ${text}\n\n`); break;
      case "callout": out.push(`${indent}> ${(b.format?.page_icon as string) ?? "💡"} ${text}\n${kids.length ? (await renderBlocks(kids, ctx, "> ")) : ""}\n`); break;
      case "code": out.push(`\`\`\`${plain(b.properties?.language).toLowerCase()}\n${plain(b.properties?.title)}\n\`\`\`\n\n`); break;
      case "divider": out.push("---\n\n"); break;
      case "equation": out.push(`\`${plain(b.properties?.title)}\`\n\n`); break;
      case "image": out.push(`${await renderImage(b, ctx)}\n\n`); break;
      case "video": case "embed": case "bookmark": case "drive": case "file": case "pdf": case "audio": {
        const src = plain(b.properties?.source) || plain(b.properties?.link);
        const label = plain(b.properties?.title) || plain(b.properties?.caption) || (b.type === "video" ? "Vídeo" : "Abrir");
        if (src) out.push(`[${label}](${src})\n\n`);
        break;
      }
      case "column_list": case "column": out.push(await renderBlocks(kids, ctx, indent)); break;
      case "table": {
        const order = (b.format?.table_block_column_order as string[]) ?? [];
        const rows = kids.map((rid) => ctx.data.blocks[rid]).filter(Boolean);
        if (order.length && rows.length) {
          const cells = (r: Block) => order.map((c) => inline(r.properties?.[c]).replace(/\|/g, "\\|").replace(/\n/g, " "));
          out.push(`| ${cells(rows[0]).join(" | ")} |\n| ${order.map(() => "---").join(" | ")} |\n`);
          for (const r of rows.slice(1)) out.push(`| ${cells(r).join(" | ")} |\n`);
          out.push("\n");
        }
        break;
      }
      case "page": ctx.registerChild(b.id, false); out.push(`- [${(b.format?.page_icon as string) ?? ""} ${plain(b.properties?.title)}](notion-page:${b.id})\n`); break;
      case "collection_view": case "collection_view_page": {
        const collId = b.collection_id ?? (b.format?.collection_pointer as { id?: string } | undefined)?.id;
        const owned = collId && ctx.data.collections[collId]?.parent_id === b.id;
        if (owned) ctx.registerChild(b.id, true);
        else ctx.report.skippedLinkedDatabases++;
        break;
      }
      default:
        if (!SIMPLE_TYPES.has(b.type)) ctx.report.unsupportedTypes[b.type] = (ctx.report.unsupportedTypes[b.type] ?? 0) + 1;
    }
  }
  return out.join("");
}

export async function runNotionImport(opts: ImportOptions): Promise<ImportReport> {
  const maxPages = opts.maxPages ?? 300;
  const report: ImportReport = {
    mode: opts.mode, pages: 0, created: 0, updated: 0, skippedEdited: 0, imagesFound: 0, imagesSaved: 0, imagesFailed: 0,
    blockTypes: {}, unsupportedTypes: {}, skippedLinkedDatabases: 0, truncated: false, warnings: [],
  };
  const idMap = new Map<string, string>(); // notion id -> MaterialDoc id (this run)
  const touched: string[] = [];
  const seen = new Set<string>();

  const { ids: categoryIds, collection: rootCollection } = await queryRows(ROOT.collectionId, ROOT.viewId);
  const schema = rootCollection?.schema ?? {};

  async function processPage(notionId: string, parentDocId: string | null, position: number, isCategory: boolean, inherited?: Collection) {
    if (seen.has(notionId)) return;
    if (report.pages >= maxPages) { report.truncated = true; return; }
    seen.add(notionId);
    report.pages++;
    const data = await loadPage(notionId);
    const page = data.blocks[notionId];
    if (!page) { report.warnings.push(`Página não encontrada: ${notionId}`); return; }
    const title = plain(page.properties?.title) || "Sem título";
    const icon = (page.format?.page_icon as string | undefined) ?? null;
    const cats = inherited?.schema ?? schema;
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(page.properties ?? {})) {
      const def = cats[k];
      if (!def || def.type === "title" || def.type === "person" || def.type === "relation") continue;
      const t = plain(v).trim();
      if (t) props[def.name] = t;
    }

    const children: { id: string; isRow: boolean }[] = [];
    const ctx: Ctx = { data, report, mode: opts.mode, registerChild: (id, isRow) => children.push({ id, isRow }) };
    const md = (await renderBlocks(page.content ?? [], ctx)).replace(/\n{3,}/g, "\n\n").trim();

    let docId: string | null = null;
    if (opts.mode === "import") {
      const existing = await prisma.materialDoc.findUnique({ where: { sourceId: notionId } });
      if (existing?.editedLocally) {
        report.skippedEdited++;
        docId = existing.id;
      } else if (existing) {
        await prisma.materialDoc.update({ where: { id: existing.id }, data: { title, icon, contentMd: md, props, parentId: parentDocId, position } });
        report.updated++;
        docId = existing.id;
        touched.push(docId);
      } else {
        const doc = await prisma.materialDoc.create({
          data: { title, icon, contentMd: md, props: Object.keys(props).length ? props : undefined, parentId: parentDocId, position, sourceId: notionId, sourceUrl: `${HOST}/${dashless(notionId)}` },
        });
        report.created++;
        docId = doc.id;
        touched.push(docId);
      }
      idMap.set(notionId, docId);
    }
    await opts.onProgress?.(report);

    let pos = 0;
    for (const c of children) {
      if (c.isRow) {
        const b = data.blocks[c.id];
        const collId = b?.collection_id ?? (b?.format?.collection_pointer as { id?: string } | undefined)?.id;
        if (!collId || !b?.view_ids?.[0]) continue;
        const { ids, collection } = await queryRows(collId, b.view_ids[0]);
        for (const rid of ids) await processPage(rid, docId, pos++, false, collection);
      } else {
        await processPage(c.id, docId, pos++, false);
      }
    }
    void isCategory;
  }

  let pos = 0;
  for (const cid of categoryIds) {
    if (opts.only) {
      const head = await loadPage(cid);
      if (!plain(head.blocks[cid]?.properties?.title).toLowerCase().includes(opts.only.toLowerCase())) continue;
    }
    await processPage(cid, null, pos++, true);
  }

  if (opts.mode === "import" && touched.length) {
    // Second pass: turn `notion-page:<id>` placeholders into links between the imported docs.
    const docs = await prisma.materialDoc.findMany({ where: { id: { in: touched } }, select: { id: true, contentMd: true } });
    for (const d of docs) {
      const fixed = d.contentMd.replace(/\(notion-page:([0-9a-f-]{32,36})\)/g, (_m, nid: string) => {
        const target = idMap.get(nid);
        return target ? `(/materiais/docs/${target})` : `(${HOST}/${dashless(nid)})`;
      });
      if (fixed !== d.contentMd) await prisma.materialDoc.update({ where: { id: d.id }, data: { contentMd: fixed } });
    }
  }
  return report;
}
