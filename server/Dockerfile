# Servidor de salas (Colyseus). Se construye desde la raíz del repo: necesita las reglas de src/core y src/mp.
#   fly deploy            (desde la raíz; usa fly.toml)
FROM node:22-alpine AS build
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci
COPY src/core src/core
COPY src/mp src/mp
COPY server/src server/src
RUN cd server && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist dist
EXPOSE 8080
USER node
CMD ["node", "dist/index.js"]
