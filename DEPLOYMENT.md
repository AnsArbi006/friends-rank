# Friends Rank Multiplayer Deployment

## Kostenlos mit Tailscale Funnel
1. Copy this project to the Docker server and run `docker compose up -d --build`.
2. On the server, enable Funnel in the Tailscale admin DNS settings, then run `tailscale funnel --bg 8787`.
3. Tailscale prints a public `https://<machine>.<tailnet>.ts.net` address. Friends do not need Tailscale to open it.
4. Set that exact address as GitHub's `VITE_LOBBY_API_ORIGIN` Actions variable, then push to `main` again.

Funnel terminates TLS and forwards only to the API's localhost port; no paid domain or router port-forwarding is required. Funnel is intended for a small test group and has bandwidth limits.

## Server With Own Domain
1. Copy this project to the Docker server.
2. Create a `.env` from `.env.example`; set `FRIENDS_RANK_DOMAIN` to the public API subdomain and `CORS_ORIGIN` to `https://ansarbi006.github.io`.
3. Point the domain's DNS A/AAAA record at the server.
4. Run `docker compose --profile public up -d --build`. Caddy obtains and renews TLS automatically.

## GitHub Pages
Set the repository Actions variable `VITE_LOBBY_API_ORIGIN` to the public address, for example `https://api.example.com`, then add it to the `Build static site` step in `.github/workflows/deploy-pages.yml` as `VITE_LOBBY_API_ORIGIN: ${{ vars.VITE_LOBBY_API_ORIGIN }}`. Push to `main` to publish the frontend with the API address.

## Local test
Run `docker compose up --build` and start the frontend with `VITE_LOBBY_API_ORIGIN=http://localhost:8787 npm run dev`.
