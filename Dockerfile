FROM node:20-alpine AS deps
# Prisma's query engine dynamically links OpenSSL, which Alpine doesn't ship by default.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
# The postinstall hook runs `prisma generate`, which needs the schema present.
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL isn't reachable at build time (Postgres doesn't exist yet in this stage) — only
# `prisma generate` (schema -> client code) runs here; `prisma migrate deploy` runs at container
# start instead, once the app can actually reach its database over the Docker network.
RUN npx prisma generate
RUN npx next build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# next.config's outputFileTracing only traces what the Next.js server itself needs — it doesn't
# know about the separate `prisma migrate deploy` CLI invocation, and Prisma's CLI pulls its own
# transitive dependency tree (e.g. the `effect` package). Copying the full node_modules from the
# builder stage (rather than cherry-picking @prisma/.prisma/prisma) avoids missing-module errors.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
