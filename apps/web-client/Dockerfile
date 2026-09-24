FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/web-client/package*.json ./apps/web-client/
COPY apps/web-client/tsconfig*.json ./apps/web-client/
COPY apps/web-client/vitest*.ts ./apps/web-client/
COPY apps/web-client/src ./apps/web-client/src

RUN npm ci --workspace=apps/web-client

ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN npm run build --workspace=apps/web-client

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY apps/web-client/package*.json ./apps/web-client/
COPY --from=builder /app/apps/web-client/public ./apps/web-client/public 2>/dev/null || true
COPY --from=builder /app/apps/web-client/.next ./apps/web-client/.next

RUN npm ci --workspace=apps/web-client --omit=dev

EXPOSE 3000

CMD ["npm", "start", "--workspace=apps/web-client"]
