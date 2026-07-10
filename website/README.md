# @throughspec/website

Throughspec's companion documentation site. Static Next.js 15 export, deployed to Vercel free tier.

## Stack

- Next.js 15 App Router with `output: 'export'` (static HTML/CSS/JS - no server).
- Tailwind CSS 3 with design tokens matching `../design/*.dc.html`.
- Self-hosted fonts via `@fontsource/source-serif-4` and `@fontsource/jetbrains-mono` (no third-party CDN).
- Pagefind for client-side search (index generated at build time).
- Playwright for smoke + link-check tests.

## Routes

| Route                              | Source                                                |
| ---------------------------------- | ----------------------------------------------------- |
| `/`                                | Landing (hero + animated Spec-Engine diagram)         |
| `/why/`                            | Why Throughspec                                        |
| `/features/`                       | Features                                               |
| `/about/`                          | About                                                  |
| `/privacy/`, `/terms/`             | Legal                                                  |
| `/changelog/`                      | Parsed from repo-root `../CHANGELOG.md` at build time  |
| `/docs/`                           | Docs shell (sidebar + on-page TOC + prev/next)         |
| `/docs/install/`                   | SRS §7.3 §1                                            |
| `/docs/quickstart/`                | SRS §7.3 §2                                            |
| `/docs/workflows/`                 | SRS §7.3 §3                                            |
| `/docs/design-prompt-library/`     | SRS §7.3 §4                                            |
| `/docs/learning-map/`              | SRS §7.3 §5                                            |
| `/docs/customization-recipes/`     | SRS §7.3 §6                                            |
| 404                                | `not-found.tsx`                                        |

## Local development

```bash
# from the repo root
npm install
npm run dev:site        # http://localhost:3000

# or, from this directory
npm run dev
```

## Production build

```bash
# from the repo root
npm run build:site      # runs `next build` then indexes with Pagefind

# artefact
ls website/out/
```

The Pagefind index lands under `website/out/pagefind/` and is served alongside
the static export at `/pagefind/…`.

## Tests

```bash
# install browsers once
npm run -w @throughspec/website test:e2e:install

# smoke + link tests against a built `out/` (Playwright launches `serve`)
npm run test:site
```

## Deploy

Vercel picks up `vercel.json` and runs `npm run build` from the workspace,
serving `out/`. Zero-cost - no server, no images to optimize, no external
dependencies beyond the npm install.
