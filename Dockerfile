# Stage 1: Build the Vite app
FROM node:20-alpine as build

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: Serve the Vite app using Nginx
FROM nginx:alpine

# Copy the build output from the first stage to the Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
