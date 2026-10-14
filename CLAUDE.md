# ACR Innovative website: project guide

Rebuild of acrinnovative.com (old static site is in `reference/acrinnovative-static/`, READ-ONLY and git-ignored). Content comes from MySQL and is edited by the founder in an Angular admin. The owner knows NestJS/Angular, not PHP: keep code conventional and well-commented.

## Layout
- `backend/` NestJS + Prisma + Handlebars views + design assets (`backend/public`). Serves the public site (SSR), `/api`, `/uploads`, and the built admin at `/admin`.
- `frontend/` Angular + Angular Material admin (base-href `/admin/`). Dev server proxies `/api` and `/uploads` to Nest (`proxy.conf.json`) so cookies work locally.
- Root `package.json`: `dev` (both), `build` (frontend first, output copied into backend, then backend), `start`, `seed:content`, `seed:admin`, `admin:reset-password`.

## Hard constraints (Hostinger Business shared hosting, Node app)
- ONE Node process. No Redis, workers, Docker, root, or new paid services (ask before adding any, or before changing the stack).
- MySQL via Prisma. Read PORT and all secrets from env; `.env.example` is committed, `.env` never is. `TRUST_PROXY=1` so rate limits/logs use the real client IP.
- Redeploys may replace the app folder: uploads live OUTSIDE it (`UPLOAD_DIR`, served at `/uploads`); CVs in `PRIVATE_DIR` are never served and only downloadable through an authenticated admin endpoint.
- Images: DB stores only a `Media` row (path + alt). Allowed uploads JPG/PNG/WebP, 5 MB, resized and converted to WebP with sharp, unique names. If sharp fails to load, store the original and skip resizing (never crash). Alt text required. Media still referenced anywhere cannot be deleted (409 with a "used in" list).
- Rich text is sanitised (`backend/src/common/sanitize.ts`) when saved AND when rendered.

## Conventions
- Template text convention: `[[words]]` = highlighted, newline = `<br>` (helper `hl`). Partials are registered by file name WITH dashes (`{{> seo-head}}`), see `main.ts`.
- One `<h1>` per page. Only the first hero slide is an `<h1>`; others use `.uk-h1`.
- Theme CSS (`public/css/style.css`) is left untouched; our additions go in `public/css/site.css`.
- Redirects live in ONE file: `backend/src/seo/redirects.ts` (phase b).
- Seeds are idempotent and never overwrite: `seed:content` (run once; `SiteSettings` is the "done" marker) and `seed:admin` (creates the admin only if none exists). Reset a password with `npm run admin:reset-password`.
- Password hashing: `bcryptjs` (pure JS, no native build on shared hosting). `sharp` is the only native dependency.
- Rich text editor in the admin: Tiptap (`ngx-tiptap`); MIT, maintained, clean HTML.

## Pinned versions (exact, no ^)
Nest 11.2.7 (core/common/platform-express), Prisma + @prisma/client 6.19.3, sharp 0.35.5, hbs 4.3.1, helmet 8.3.0, TypeScript 5.9.3, Node 22 locally (Hostinger: 20/22). Angular versions are pinned when `frontend/` is created in phase (d) and recorded here.

## Phases
a) scaffold/schema/seed/public pages (done) · b) SEO · c) auth + admin API · d) Angular admin · e) contact/careers forms · f) build script + Hostinger notes. Stop after each phase for review.

## Local dev notes
- `backend/.env` (git-ignored) points at XAMPP MySQL `mysql://root:@localhost:3306/acr_innovative_web`.
- First run: `cd backend && npm install && npx prisma migrate dev && npm run seed:content && npm run seed:admin && npm run start:dev`.
- Seeded content images are copied to `UPLOAD_DIR/seed/`.
