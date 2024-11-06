import * as cf from "@cdktf/provider-cloudflare";
import { DOMAIN } from "../constants.ts";
import { WorkspaceStack } from "../util.ts";

const CloudflareProvider = cf.provider.CloudflareProvider;
const ZeroTrustAccessTag = cf.zeroTrustAccessTag.ZeroTrustAccessTag;
const ZeroTrustAccessApplication =
  cf.zeroTrustAccessApplication.ZeroTrustAccessApplication;

export function create(ws: WorkspaceStack) {
  // Must set CLOUDFLARE_API_TOKEN, or CLOUDFLARE_EMAIL+CLOUDFLARE_API_KEY
  new CloudflareProvider(ws, "cloudflare", {});

  new ZeroTrustAccessTag(ws, "media", {
    zoneId: DOMAIN.zoneId,
    name: "media",
  });

  new ZeroTrustAccessApplication(ws, "example", {
    zoneId: DOMAIN.zoneId,
    name: "ExampleApp",
    domain: `example.${DOMAIN.name}`,
    sessionDuration: "730h",
    logoUrl:
      "https://raw.githubusercontent.com/Sonarr/Sonarr/refs/heads/develop/Logo/Sonarr.svg",
  });
}
