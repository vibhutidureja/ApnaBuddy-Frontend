# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Expo web app (this creates a 'dist' folder)
RUN npx expo export

# Serve stage using NGINX
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
