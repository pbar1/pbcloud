import * as constants from "../constants.ts";
import * as cf from "@cdktf/provider-cloudflare";
import { WorkspaceStack, capitalize } from "../util.ts";
import { Construct } from "constructs";

import CloudflareProvider = cf.provider.CloudflareProvider;
import AccessTag = cf.zeroTrustAccessTag.ZeroTrustAccessTag;
import AccessApplication = cf.zeroTrustAccessApplication.ZeroTrustAccessApplication;
import AccessPolicy = cf.zeroTrustAccessPolicy.ZeroTrustAccessPolicy;

const zoneId = constants.DOMAIN.zoneId;
const domain = constants.DOMAIN.name;
const sessionDuration = "730h"; // 1 month
const apps = [
  // {
  //   name: "prowlarr",
  //   service: "http://prowlarr.media:9696",
  //   logoUrl:
  //     "https://raw.githubusercontent.com/Prowlarr/Prowlarr/develop/Logo/Prowlarr.svg",
  // },
  // {
  //   name: "sonarr",
  //   service: "http://sonarr.media:8989",
  //   logoUrl:
  //     "https://raw.githubusercontent.com/Sonarr/Sonarr/develop/Logo/Sonarr.svg",
  // },
  // {
  //   name: "radarr",
  //   service: "http://radarr.media:7878",
  //   logoUrl:
  //     "https://raw.githubusercontent.com/Radarr/Radarr/develop/Logo/Radarr.svg",
  // },
  // {
  //   name: "readarr",
  //   service: "http://readarr.media:8787",
  //   logoUrl:
  //     "https://raw.githubusercontent.com/Readarr/Readarr/develop/Logo/Readarr.svg",
  // },
  {
    name: "lidarr",
    service: "http://lidarr.media:8686",
    logoUrl:
      "https://raw.githubusercontent.com/Lidarr/Lidarr/develop/Logo/Lidarr.svg",
    tags: ["media"],
  },
];

export function create(ws: WorkspaceStack) {
  // Must set CLOUDFLARE_API_TOKEN, or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY
  new CloudflareProvider(ws, "cloudflare");

  const tags = createTags(ws, ["media"]);

  const policyAdmins = new AccessPolicy(ws, "admins", {
    accountId: constants.CLOUDFLARE_ACCOUNT_ID,
    name: "admins",
    decision: "allow",
    include: [{ group: ["e314ccda-c53b-42fd-8056-5b1306b6416c"] }],
  });

  // TODO: Sigh...
  // https://github.com/cloudflare/terraform-provider-cloudflare/issues/4495
  for (const { name, service, logoUrl } of apps) {
    new AccessApplication(ws, name, {
      accountId: constants.CLOUDFLARE_ACCOUNT_ID,
      name: capitalize(name),
      domain: `${name}.${domain}`,
      sessionDuration,
      logoUrl,
      policies: ["admins"],
    });
  }
}

function createTags(scope: Construct, tags: string[]): Map<string, AccessTag> {
  const map = new Map<string, AccessTag>();
  for (const name of tags) {
    map.set(name, new AccessTag(scope, name, { zoneId, name }));
  }
  return map;
}
