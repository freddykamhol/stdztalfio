import { NextResponse } from "next/server";

import { getStundenzettelMonat } from "../../../../../lib/stundenzettel-data";
import { createStundenzettelPdf } from "../../../../../lib/stundenzettel-pdf";
import { hasSiteAccess } from "../../../../../lib/site-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jahr: string;
    monat: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const hatZugriff = await hasSiteAccess();

  if (!hatZugriff) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { jahr, monat } = await context.params;
  const jahrNummer = Number.parseInt(jahr, 10);
  const monatNummer = Number.parseInt(monat, 10);

  if (
    Number.isNaN(jahrNummer) ||
    Number.isNaN(monatNummer) ||
    monatNummer < 1 ||
    monatNummer > 12
  ) {
    return NextResponse.json({ error: "Ungültiger Monat." }, { status: 400 });
  }

  const stundenzettelMonat = await getStundenzettelMonat(jahrNummer, monatNummer);

  if (!stundenzettelMonat) {
    return NextResponse.json({ error: "Für diesen Monat liegen keine Daten vor." }, { status: 404 });
  }

  const pdfBytes = await createStundenzettelPdf(stundenzettelMonat);
  const dateiName = `stundenzettel-${jahrNummer}-${String(monatNummer).padStart(2, "0")}.pdf`;
  const pdfBuffer = Buffer.from(pdfBytes);

  return new Response(pdfBuffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${dateiName}"`,
      "Content-Type": "application/pdf",
    },
    status: 200,
  });
}
