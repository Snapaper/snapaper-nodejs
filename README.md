# Snapaper Node.js
The Node.js Back-End of Snapaper

<br/>

## Dependencies
+ Node-Crawler
+ Express
+ Express-Generator

<br/>

## Development
```bash
git clone git@github.com:Snapaper/snapaper-nodejs.git
```

<br/>

Make sure Node.js has been installed before you continue. See `Dockerfile` for recommended Node.js environment version.

We use `pnpm` for development and `yarn` in production environment:

```bash
pnpm/yarn install
```

<br/>

By default, the API service will be listening on port 8080. To change this behaviour, modify environment variable `PORT`.
<br/>
```bash
pnpm/yarn run start
```

<br/>

## Deployment
### Redis
We use Redis to cache API responses. Currently, we use a remote Redis database service provided [Upstash](https://upstash.com).

<br>

### Docker image
Build Docker image:
```bash
docker build --tag=snapaper-nodejs .
```

<br>

### Deploy to Fly
Deploy with Fly.io:
```bash
fly launch
fly deploy
```

Scale to 2 instances:
```bash
fly scale count 2
```
