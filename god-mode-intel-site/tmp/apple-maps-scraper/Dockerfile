# Use Apify's Node.js image with Playwright pre-installed
FROM apify/actor-node-playwright-chrome:20

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for TypeScript)
RUN npm install --include=dev

# Copy source code
COPY . ./

# Build TypeScript using npx to ensure it finds the local tsc
RUN npx tsc

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Run the actor
CMD npm start
