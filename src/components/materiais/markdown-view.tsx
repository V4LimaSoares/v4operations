import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

/** Renders a document's Markdown. Raw HTML is parsed (so imported `<details>` toggles work) but
 *  always passed through rehype-sanitize afterwards — scripts/handlers/iframes never survive. */
export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="doc-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
