import { AccessGate } from "./components/access-gate";
import { StundenzettelDashboard } from "./components/stundenzettel-dashboard";
import { hasSiteAccess } from "./lib/site-auth";
import { getStundenzettelMonate } from "./lib/stundenzettel-data";

export default async function HomePage() {
  const hasAccess = await hasSiteAccess();

  if (!hasAccess) {
    return <AccessGate />;
  }

  const monate = await getStundenzettelMonate();

  return <StundenzettelDashboard monate={monate} />;
}
