# Friends Rank Multiplayer Deployment

## Server
1. Copy this project to the Docker server.
2. Create a `.env` from `.env.example`; set `FRIENDS_RANK_DOMAIN` to the public API subdomain and `CORS_ORIGIN` to `https://ansarbi006.github.io`.
3. Point the domain's DNS A/AAAA record at the server.
4. Run `docker compose --profile public up -d --build`. Caddy obtains and renews TLS automatically.

## GitHub Pages
Set the repository Actions variable `VITE_LOBBY_API_ORIGIN` to the public address, for example `https://api.example.com`, then add it to the `Build static site` step in `.github/workflows/deploy-pages.yml` as `VITE_LOBBY_API_ORIGIN: ${{ vars.VITE_LOBBY_API_ORIGIN }}`. Push to `main` to publish the frontend with the API address.

## Local test
Run `docker compose up --build` and start the frontend with `VITE_LOBBY_API_ORIGIN=http://localhost:8787 npm run dev`.
