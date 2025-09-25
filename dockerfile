# Use Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy rest of backend code
COPY . .

# Expose port (example: 5000)
EXPOSE 4002

# Start backend
CMD ["npm", "start"]
