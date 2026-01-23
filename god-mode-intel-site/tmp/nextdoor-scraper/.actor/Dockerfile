# Use Apify's full Playwright image (includes Firefox for Camoufox)
FROM apify/actor-node-playwright:20

COPY package*.json ./

# Install dependencies (include optional for camoufox native bindings)
RUN npm install --omit=dev \
    && echo "Dependencies installed successfully"

# Fetch Camoufox browser (stealth Firefox) and set permissions
RUN npx camoufox fetch \
    && chmod -R 755 /home/myuser/.cache/camoufox \
    && echo "Camoufox browser installed successfully"

# Copy pre-built files
COPY dist ./dist

# Run the actor
CMD npm start
