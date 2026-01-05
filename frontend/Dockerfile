FROM node:20-alpine

WORKDIR /app

# Configure npm to use public registry
RUN npm config set registry https://registry.npmjs.org/

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && \
    npm install ajv@^8.0.0

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable to disable host check
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
ENV WATCHPACK_POLLING=true

# Start the application
CMD ["npm", "start"]
