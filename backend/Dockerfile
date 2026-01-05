FROM node:20-alpine

WORKDIR /app

# Copy .npmrc first to configure npm
COPY .npmrc ./

# Copy package files
COPY package*.json ./

# Install dependencies using our .npmrc configuration
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"]
