FROM node:18-alpine

# Install a lightweight HTTP server
RUN npm install -g http-server

# Set working directory
WORKDIR /app

# Copy UI files
COPY . .

# Expose port
EXPOSE 8080

# Start the server
CMD ["http-server", "-p", "8080", "-c-1"]
