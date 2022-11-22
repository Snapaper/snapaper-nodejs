# Snapaper Nodejs
The Node.js Back-end of Snapaper

<br/>

## Dependency
+ Node-Crawler
+ Express
+ Express-Generator

<br/>

## Development
```bash
git clone git@github.com:Snapaper/snapaper-nodejs.git
```

<br/>

Make sure Node.js has been installed before you continue.
<br/>
```bash
yarn install
```

<br/>

By default, the API service will be listening to port 8080. To change this behaviour, modify environment variable `PORT`.
<br/>
```bash
yarn run start
```

<br/>

## Deployment
Build Docker image:
```bash
docker build --tag=snapaper-nodejs .
```

Deploy with Fly.io:
```bash
fly launch
fly deploy
```

Scale to 2 instances:
```bash
fly scale count 2
```
