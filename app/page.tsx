import { hasSiteAccess } from "./lib/site-auth";
import { getStundenzettelMonate } from "./lib/stundenzettel-data";

export default async function HomePage() {
  const hasAccess = await hasSiteAccess();

  if (!hasAccess) {
    const { AccessGate } = await import("./components/access-gate");
    return <AccessGate />;
  }

  const monate = await getStundenzettelMonate();
  const { StundenzettelDashboard } = await import("./components/stundenzettel-dashboard");

  return <StundenzettelDashboard monate={monate} />;
}
