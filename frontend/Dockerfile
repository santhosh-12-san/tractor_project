# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors and lockfile
COPY package*.json ./

# Install dependencies using clean install
RUN npm ci

# Copy code and compile the production bundle
COPY . .
RUN npm run build

# Stage 2: Production web server
FROM nginx:alpine

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
