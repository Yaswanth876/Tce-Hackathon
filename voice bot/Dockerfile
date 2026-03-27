# Use official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["pnpm", "start"]
