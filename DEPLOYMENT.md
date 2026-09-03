# Friends Rank Multiplayer Deployment

## Kostenlos mit Tailscale Funnel
1. Copy this project to the Docker server and run `docker compose up -d --build`.
2. On the server, enable Funnel in the Tailscale admin DNS settings, then run `tailscale funnel --bg 8787`.
3. Tailscale prints a public `https://<machine>.<tailnet>.ts.net` address. Friends do not need Tailscale to open it.
4. The published frontend uses the server address directly; players do not configure anything.

Funnel terminates TLS and forwards only to the API's localhost port; no paid domain or router port-forwarding is required. Funnel is intended for a small test group and has bandwidth limits.

## Server With Own Domain
1. Copy this project to the Docker server.
2. Create a `.env` from `.env.example`; set `FRIENDS_RANK_DOMAIN` to the public API subdomain and `CORS_ORIGIN` to `https://ansarbi006.github.io`.
3. Point the domain's DNS A/AAAA record at the server.
4. Run `docker compose --profile public up -d --build`. Caddy obtains and renews TLS automatically.

## GitHub Pages
The published frontend is configured for `https://serverarbi.tail69ecfd.ts.net` and needs no client-side setup.

## Local test
Run `docker compose up --build` and start the frontend with `VITE_LOBBY_API_ORIGIN=http://localhost:8787 npm run dev`.
