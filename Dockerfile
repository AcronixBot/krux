FROM node:20

WORKDIR /DATA/Projekte/APISERVER

COPY package*.json .

RUN npm install

EXPOSE 2001/tcp

COPY . .

CMD ["npm", "run", "server"]