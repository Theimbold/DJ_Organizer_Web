# Stage 1: Build the Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source and build
COPY . .
RUN npm run build

# Stage 2: Setup the Server
FROM node:20-alpine

# Install system dependencies
# python3, make, g++: required for building native modules like sqlite3
# ffmpeg: required for audio processing (more reliable than npm binaries on Alpine)
RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app/server

# Install server dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy server source code
COPY server/ .

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ../dist

# Create directories for persistent data
RUN mkdir -p uploads processed/covers

# Environment variables
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Command to run the application
CMD ["node", "index.js"]
