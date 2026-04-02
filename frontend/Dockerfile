# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-slim AS install

WORKDIR /app
COPY package.json ./
RUN npm install

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM install AS build

ARG NEXT_PUBLIC_API_URL=/api

COPY src/ src/
COPY public/ public/
COPY next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

COPY --from=build /app/.next/standalone/ ./
COPY --from=build /app/.next/static/ .next/static/
COPY --from=build /app/public/ public/

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "server.js"]
