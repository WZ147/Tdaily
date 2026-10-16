FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
RUN mkdir -p data
ENV PORT=3888
EXPOSE 3888
VOLUME ["/app/data"]
CMD ["node", "server.js"]
