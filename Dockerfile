FROM node:18-bullseye

# Installation de FFmpeg (plus simple et fiable)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie des dépendances d'abord (optimisation cache Docker)
COPY package*.json ./
COPY yarn.lock ./

# Installation avec Yarn (comme spécifié dans package.json)
RUN yarn install --production --frozen-lockfile

# Copie du code source
COPY . .

# Ports exposés
EXPOSE 3000
EXPOSE 5000

# Volume pour les sessions
VOLUME ["/app/sessions"]

# Commande de démarrage
CMD ["npm", "start"]
