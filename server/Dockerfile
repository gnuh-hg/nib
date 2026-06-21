# Nib Hocuspocus server — production image
FROM node:20-slim

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install

# Build TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies for a leaner runtime image
RUN npm prune --production

# Render injects PORT; default 3000 for local docker run
EXPOSE 3000

CMD ["node", "dist/index.js"]
