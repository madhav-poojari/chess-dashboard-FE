# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Build the application
RUN npm run build

# Production stage - just copy the built files
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# This stage just holds the built files
# They will be copied to the nginx image
CMD ["sh"]

