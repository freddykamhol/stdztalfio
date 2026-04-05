import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "../../lib/prisma";
import { getRuntimeConfigurationStatus } from "../../lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const config = getRuntimeConfigurationStatus();
  const database = await checkDatabaseHealth();
  const ok =
    config.sitePasswordConfigured &&
    config.stundenFormPasswordConfigured &&
    config.stundenFormLinkTokenConfigured &&
    database.ok;

  return NextResponse.json({
    ok,
    name: "stundenalfio",
    config,
    database,
    timestamp: new Date().toISOString(),
  }, { status: ok ? 200 : 503 });
}
