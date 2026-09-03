FROM node:22-alpine
WORKDIR /app
COPY server/package.json ./package.json
RUN npm install --omit=dev
COPY server/index.js ./index.js
EXPOSE 8787
CMD ["npm", "start"]
