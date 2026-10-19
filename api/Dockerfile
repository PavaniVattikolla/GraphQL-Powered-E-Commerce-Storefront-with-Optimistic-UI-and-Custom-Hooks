FROM node:20-alpine

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Default API port
EXPOSE 4000

ENV NODE_ENV=production
ENV API_PORT=4000

CMD ["npm", "start"]
