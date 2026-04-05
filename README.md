# Stundenalfio

Starter-Projekt mit demselben technischen Stack wie `ssdalarm`:

- Next.js 16 mit App Router
- React 19 und TypeScript
- Tailwind CSS 4
- Prisma mit PostgreSQL
- `next-themes`, `lucide-react` und `framer-motion`

## Schnellstart

```bash
npm install
npm run db:generate
npm run dev
```

## Benötigte Umgebungsvariablen

Lege vor dem Start eine `.env` mit diesen Werten an:

```bash
DATABASE_URL="postgresql://USER:PASSWORT@HOST:5432/stundenalfio?schema=public"
SITE_PASSWORD="ein-langes-seiten-passwort"
STUNDEN_FORM_PASSWORD="ein-langes-formular-passwort"
STUNDEN_FORM_LINK_TOKEN="eine-lange-zufaellige-token-kette"
```

Für Production sind alle vier Werte Pflicht.

Wenn du lokal eine Datenbank laufen hast, kannst du danach die erste Migration anlegen:

```bash
npm run db:migrate -- --name init
npm run db:seed
```

## Production Deploy

Empfohlene Runtime:

- Node `20.20.2`
- PostgreSQL mit gesetzter `DATABASE_URL`

Der Produktionsablauf ist jetzt:

```bash
npm install
npm run build
npm start
```

`npm start` validiert die Runtime-Umgebung und führt vor dem Serverstart automatisch `prisma migrate deploy` aus.

Wenn du alles in einem Schritt vorbereiten und starten willst:

```bash
npm run launch:production
```

Der Healthcheck unter `/api/health` prüft jetzt nicht nur die Konfiguration, sondern auch die echte Datenbankverbindung und liefert bei Problemen HTTP `503`.

## Enthalten

- Startseite als Dashboard-Template
- Prisma-Schema für Workspace, Projekte und Zeitbuchungen
- Produktionsfähiger Health-Endpoint unter `/api/health`
- Theme-Provider und Tailwind-Token
