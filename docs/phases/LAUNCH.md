# Phase 11 — Launch

## Deploy

Static hosting from `dist/` after `npm run build`.

### Vercel (configured)

See [vercel.json](../../vercel.json) at repo root.

```bash
npm run build
npx vercel --prod
```

### Alternatives

- Cloudflare Pages: build command `npm run build`, output `dist`
- GitHub Pages: use `actions/deploy-pages` on main

## Launch Assets

- Trailer from Reedwater Basin gameplay
- Press kit: screenshots, Nanabozho logo, Everden key art
- Store: itch.io or dedicated landing page (no Steam for web-first)

## Legal

- EULA, privacy policy (minimal analytics if any)
- Credits: Nanabozho studio, contributors, font licenses

## Gold Master Gate

- [ ] Production build smoke tested
- [ ] Save migration doc for v1 → v2
- [ ] Rollback branch ready
- [ ] Support FAQ from beta
