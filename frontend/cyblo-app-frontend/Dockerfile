# Dockerfile for Angular application

# Base image
FROM node:latest AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY ./ /app

# Install dependencies
RUN npm install

# Build the Angular app
RUN npm run build -- --output-path=./dist 
