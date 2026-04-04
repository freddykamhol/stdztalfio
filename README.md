# Stundenalfio

Starter-Projekt mit demselben technischen Stack wie `ssdalarm`:

- Next.js 16 mit App Router
- React 19 und TypeScript
- Tailwind CSS 4
- Prisma 7 mit PostgreSQL
- `next-themes`, `lucide-react` und `framer-motion`

## Schnellstart

```bash
npm install
npm run db:generate
npm run dev
```

Optional kannst du den Seitenzugang mit `SITE_PASSWORD` absichern.

Wenn du lokal eine Datenbank laufen hast, kannst du danach die erste Migration anlegen:

```bash
npm run db:migrate -- --name init
npm run db:seed
```

## Enthalten

- Startseite als Dashboard-Template
- Prisma-Schema für Workspace, Projekte und Zeitbuchungen
- Basis-Health-Endpoint unter `/api/health`
- Theme-Provider und Tailwind-Token
