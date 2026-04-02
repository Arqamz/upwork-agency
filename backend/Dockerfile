# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-slim AS install

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM install AS build

COPY src/ src/
COPY prisma/ prisma/
COPY tsconfig.json nest-cli.json prisma.config.ts ./

RUN npx prisma generate && npm run build

# ── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/dist/ dist/
COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/prisma/ prisma/
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
