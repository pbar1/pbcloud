import * as cf from "@cdktf/provider-cloudflare";
import { WorkspaceStack } from "../util.ts";

const CloudflareProvider = cf.provider.CloudflareProvider;
const AccessApplication = cf.accessApplication.AccessApplication;

export function create(ws: WorkspaceStack) {
  // Must set CLOUDFLARE_API_TOKEN
  new CloudflareProvider(ws, "cloudflare", {});

  new AccessApplication(ws, "example", {
    zoneId: "0ba0d05c6ffbfa2e8b254e07f1a29982",
    name: "My Example App",
    domain: "goober.xnauts.net",
    sessionDuration: "1m",
  });
}
