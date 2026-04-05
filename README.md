# Stundenalfio

Starter-Projekt mit demselben technischen Stack wie `ssdalarm`:

- Next.js 16 mit App Router
- React 19 und TypeScript
- Tailwind CSS 4
- Prisma mit SQLite
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
DATABASE_URL="file:./data/stundenalfio.db"
SITE_PASSWORD="ein-langes-seiten-passwort"
STUNDEN_FORM_PASSWORD="ein-langes-formular-passwort"
STUNDEN_FORM_LINK_TOKEN="eine-lange-zufaellige-token-kette"
```

`DATABASE_URL` ist optional. Wenn du nichts setzt, nutzt die App automatisch `file:./data/stundenalfio.db` und legt die SQLite-Datei unter `prisma/data/stundenalfio.db` an.

Danach kannst du die Datenbank-Datei vorbereiten und die Migrationen anwenden:

```bash
npm run prepare:sqlite
npm run db:migrate
npm run db:seed
```

## Production Deploy

Empfohlene Runtime:

- Node `20.20.2`
- beschreibbarer Projektordner für `prisma/data/stundenalfio.db`

Der Produktionsablauf ist jetzt:

```bash
npm install
npm run build
npm start
```

`npm start` bereitet den SQLite-Ordner vor, validiert die Runtime-Umgebung und führt vor dem Serverstart automatisch `prisma migrate deploy` aus.

Wenn du alles in einem Schritt vorbereiten und starten willst:

```bash
npm run launch:production
```

Der Healthcheck unter `/api/health` prüft jetzt nicht nur die Konfiguration, sondern auch den echten Zugriff auf die SQLite-Datenbank und liefert bei Problemen HTTP `503`.

## Enthalten

- Startseite als Dashboard-Template
- Prisma-Schema für Workspace, Projekte und Zeitbuchungen
- Produktionsfähiger Health-Endpoint unter `/api/health`
- Theme-Provider und Tailwind-Token
