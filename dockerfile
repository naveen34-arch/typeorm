FROM node:18-buster AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json npm-lock.yaml* ./

# Install all dependencies (dev + production for building)
RUN npm install

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --prod

# Create non-root user for security
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001

# Change ownership to nodejs user
# RUN chown -R nodejs:nodejs /app

# Switch to non-root user
# USER nodejs

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/app.js"]