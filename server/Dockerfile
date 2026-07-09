FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
RUN npm install --prefix server
COPY server ./server
COPY shared ./shared
COPY public/data/scenes ./public/data/scenes
COPY src/engine/NavMesh.ts ./src/engine/NavMesh.ts
COPY src/data/sceneTypes.ts ./src/data/sceneTypes.ts
WORKDIR /app/server
RUN npm run build
EXPOSE 2567
CMD ["node", "dist/server/src/index.js"]
