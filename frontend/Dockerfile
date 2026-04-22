# ETAPA 1: Construcción (Usamos NODE para poder usar npm)
FROM public.ecr.aws/docker/library/node:20-alpine AS builder
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm ci

# Copiamos el resto de los archivos para compilar
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Generamos la carpeta /dist
RUN npm run build

# ETAPA 2: Servidor (Usamos NGINX para producción)
FROM public.ecr.aws/nginx/nginx:1.27-alpine AS runner
# Copiamos lo que compilamos en la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80