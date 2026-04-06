# Willkommen bei Stundenalfio

Stundenalfio ist eine kleine, produktionsnahe Web-App zur Erfassung, Verwaltung und Auswertung von Stundenzetteln. Die Anwendung ist auf einen einfachen Ablauf ausgelegt: Einträge werden über ein geschütztes Formular erfasst, im Dashboard monatsweise ausgewertet und bei Bedarf als PDF exportiert.

Aktuell unterstützt die App diese Eintragsarten:

- `Tageseinsatz`
- `Übernachtung`
- `Urlaub`
- `Krank`

`Urlaub` und `Krank` sind ganztägige Einträge. Sie werden über einen Datumsbereich erfasst und intern als einzelne Tage gespeichert. Zusätzlich können pro Eintrag mehrere benannte Bilder hochgeladen werden.

## Überblick

Wichtige Funktionen:

- geschütztes Dashboard mit Monatsübersicht
- separates, token-geschütztes Formular für neue Stundeneinträge
- Bearbeiten und Löschen bestehender Einträge mit zusätzlichem Formular-Passwort
- automatische Summen für Stunden, Pause, Tankkosten, Urlaubstage, Kranktage und Übernachtungen
- Monats-PDFs direkt aus dem Dashboard
- SQLite als Datenbank mit Prisma-Migrationen
- Healthcheck unter `/api/health`

Technischer Stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma
- SQLite

## Kaufanimation

Wenn du Stundenalfio intern vorstellen oder jemandem schmackhaft machen willst, sind das die stärksten Argumente:

- weniger Papier, weniger WhatsApp-Chaos, weniger Nachfragen
- Stunden, Urlaub, Kranktage und Übernachtungen werden einheitlich erfasst
- das Formular ist simpel genug für die schnelle Nutzung im Alltag
- Monatsübersichten und PDF-Export sparen Zeit in Büro, Abrechnung und Nachweisführung
- mehrere benannte Bilder pro Eintrag machen Dokumentation und Rückfragen deutlich einfacher
- die App läuft mit SQLite schlank, günstig und ohne unnötige Infrastruktur
- bestehende Daten lassen sich per Migration weiterverwenden, statt alles neu aufzusetzen

Kurz gesagt:

Stundenalfio macht aus verstreuten Einzelinfos einen sauberen, nachvollziehbaren und sofort auswertbaren Stundenzettel-Prozess.

## Zugriffskonzept

Die Anwendung hat bewusst zwei getrennte Schutzebenen:

1. Dashboard unter `/`
   Dafür wird `SITE_PASSWORD` verwendet.
2. Erfassungsformular unter `/stunden/neu?token=...`
   Dafür wird `STUNDEN_FORM_LINK_TOKEN` verwendet.

Zum Bearbeiten oder Löschen eines bestehenden Eintrags wird zusätzlich `STUNDEN_FORM_PASSWORD` abgefragt.

## Eintragsarten

`Tageseinsatz` und `Übernachtung`:

- Datum
- Beginn und Ende
- Pause
- Tankkosten
- Bemerkung
- optionale benannte Bilder

`Urlaub` und `Krank`:

- Von- und Bis-Datum
- keine Uhrzeiten
- keine Pause
- keine Tankkosten
- Bemerkung statt Baustelle
- Speicherung als einzelne Tages-Einträge
- optionale benannte Bilder

## Voraussetzungen

- Node.js `20.20.x`
- `npm`
- beschreibbarer Ordner für die SQLite-Datei

Wenn keine `DATABASE_URL` gesetzt ist, verwendet die App standardmäßig:

```bash
file:./data/stundenalfio.db
```

Intern wird dieser Pfad auf `prisma/data/stundenalfio.db` im Projekt aufgelöst.

## Einrichtung lokal

1. Abhängigkeiten installieren:

```bash
npm install
```

2. `.env` anlegen:

```bash
DATABASE_URL="file:./data/stundenalfio.db"
SITE_PASSWORD="ein-langes-seiten-passwort"
STUNDEN_FORM_PASSWORD="ein-langes-formular-passwort"
STUNDEN_FORM_LINK_TOKEN="eine-lange-zufaellige-token-kette"
```

3. Prisma Client generieren:

```bash
npm run db:generate
```

4. SQLite-Ordner vorbereiten:

```bash
npm run prepare:sqlite
```

5. Migrationen lokal anwenden:

```bash
npm run db:migrate
```

6. Optional Demo-Daten anlegen:

```bash
npm run db:seed
```

7. Entwicklungsserver starten:

```bash
npm run dev
```

## Nutzung im Alltag

Dashboard:

- URL: `/`
- Login mit `SITE_PASSWORD`
- zeigt Monatsübersichten, Summen und gespeicherte Einträge
- PDF-Export direkt aus der Monatsansicht

Neuer Stundeneintrag:

- URL: `/stunden/neu?token=<STUNDEN_FORM_LINK_TOKEN>`
- geeignet zum schnellen Erfassen ohne Dashboard-Zugang
- unterstützt mehrere benannte Bild-Uploads

Bearbeitung:

- erfolgt direkt aus dem Dashboard
- verlangt zusätzlich `STUNDEN_FORM_PASSWORD`

Healthcheck:

- URL: `/api/health`
- liefert `200`, wenn Konfiguration und Datenbankzugriff in Ordnung sind
- liefert `503`, wenn Konfiguration fehlt oder die Datenbank nicht erreichbar ist

## Wichtige npm-Skripte

```bash
npm run dev
npm run build
npm start
npm run launch:production
npm run lint
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:migrate:safe
npm run db:seed
```

Kurz erklärt:

- `npm run dev`: lokaler Entwicklungsserver
- `npm run build`: Produktions-Build
- `npm start`: startet die App produktionsnah und führt vorher `prisma migrate deploy` aus
- `npm run launch:production`: Build und Start in einem Schritt
- `npm run db:migrate`: lokale Entwicklungs-Migration
- `npm run db:migrate:deploy`: wendet vorhandene Migrationen ohne neue Erstellung an
- `npm run db:migrate:safe`: sichere Migration für eine bereits existierende produktive SQLite-Datei

## Produktion und Deploy

Empfohlener Ablauf für ein neues Deployment:

```bash
npm install
npm run build
npm start
```

`npm start` macht dabei Folgendes:

- prüft die Runtime-Umgebung
- bereitet den SQLite-Ordner vor
- führt `prisma migrate deploy` aus
- startet anschließend den Node-Server

## Bestehende SQLite-Datenbank auf dem Server

Wenn auf dem Server bereits eine echte produktive Datenbank existiert, ist dieser Punkt besonders wichtig:

- die bestehende DB-Datei nicht überschreiben
- keine leere neue SQLite-Datei an ihre Stelle kopieren
- `DATABASE_URL` auf genau diese vorhandene Datei zeigen lassen
- `npm run db:seed` nicht auf Produktion ausführen

Empfehlung für produktive Server:

- verwende einen absoluten Pfad in `DATABASE_URL`
- speichere die DB außerhalb eines austauschbaren Release-Ordners

Beispiel:

```bash
DATABASE_URL="file:/var/www/stundenalfio-data/stundenalfio.db"
```

## Sichere Migration einer bestehenden Server-DB

Für Server mit bestehender SQLite-Datei gibt es ein sicheres Migrationsskript:

```bash
npm run db:migrate:safe
```

Dieses Skript:

- bricht ab, wenn die SQLite-Datei nicht existiert
- erstellt vor der Migration ein Backup
- sichert bei Bedarf auch `-wal` und `-shm`
- führt danach `prisma migrate deploy` auf der vorhandenen DB aus

Danach kann die App normal gestartet werden:

```bash
npm start
```

## Hinweise zum Seed

Das Seed-Skript ist nur für lokale Entwicklung oder Testumgebungen gedacht.

Es legt Demo-Daten an und sollte nicht auf einem produktiven Server mit echten Stundenzetteln ausgeführt werden.

## Typische Fehlerquellen

Dashboard lädt nicht:

- `DATABASE_URL` zeigt auf einen falschen Pfad
- SQLite-Datei ist nicht lesbar oder nicht beschreibbar
- Migrationen wurden auf dem Server noch nicht ausgeführt

Formular unter `/stunden/neu` zeigt `404`:

- der `token` in der URL stimmt nicht mit `STUNDEN_FORM_LINK_TOKEN` überein

Bearbeiten/Löschen funktioniert nicht:

- das eingegebene `STUNDEN_FORM_PASSWORD` ist falsch

Healthcheck liefert `503`:

- eine oder mehrere Umgebungsvariablen fehlen
- die Datenbank ist nicht erreichbar
- die Tabellen wurden noch nicht migriert

## Projektziel

Die App soll einen einfachen, robusten und deploybaren Stundenzettel-Workflow bieten:

- Erfassung unterwegs
- geschütztes Dashboard
- klare Monatsübersichten
- PDF-Ausgabe
- sichere SQLite-Migrationen ohne Datenverlust im normalen Deploy-Ablauf
