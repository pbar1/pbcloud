import * as constants from "../constants.ts";
import * as cf from "@cdktf/provider-cloudflare";
import { WorkspaceStack, capitalize } from "../util.ts";

import CloudflareProvider = cf.provider.CloudflareProvider;
import AccessTag = cf.zeroTrustAccessTag.ZeroTrustAccessTag;
import AccessApplication = cf.zeroTrustAccessApplication.ZeroTrustAccessApplication;
import AccessPolicy = cf.zeroTrustAccessPolicy.ZeroTrustAccessPolicy;

const accountId = constants.CLOUDFLARE_ACCOUNT_ID;
const zoneId = constants.CLOUDFLARE_ZONE_ID;
const domain = constants.DOMAIN;
const sessionDuration = "730h"; // 1 month
const tags = ["media"];
const apps = [
  // {
  //   name: "prowlarr",
  //   service: "http://prowlarr.media:9696",
  //   logoUrl: arrLogo("prowlarr"),
  //   tags: ["media"],
  // },
  // {
  //   name: "sonarr",
  //   service: "http://sonarr.media:8989",
  //   logoUrl: arrLogo("sonarr"),
  //   tags: ["media"],
  // },
  // {
  //   name: "radarr",
  //   service: "http://radarr.media:7878",
  //   logoUrl: arrLogo("radarr"),
  //   tags: ["media"],
  // },
  // {
  //   name: "readarr",
  //   service: "http://readarr.media:8787",
  //   logoUrl: arrLogo("readarr"),
  //   tags: ["media"],
  // },
  {
    name: "lidarr",
    service: "http://lidarr.media:8686",
    logoUrl: arrLogo("lidarr"),
    tags: ["media"],
  },
];

function arrLogo(name: string): string {
  const n = capitalize(name);
  return `https://raw.githubusercontent.com/${n}/${n}/develop/Logo/${n}.svg`;
}

export function create(ws: WorkspaceStack) {
  // Must set CLOUDFLARE_API_TOKEN, or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY
  new CloudflareProvider(ws, "cloudflare");

  for (const name of tags) {
    new AccessTag(ws, name, { zoneId, name });
  }

  const policyAdmins = new AccessPolicy(ws, "admins", {
    accountId,
    name: "admins",
    decision: "allow",
    include: [{ group: ["e314ccda-c53b-42fd-8056-5b1306b6416c"] }],
  });

  for (const { name, logoUrl, tags } of apps) {
    new AccessApplication(ws, name, {
      accountId,
      name: capitalize(name),
      domain: `${domain}/${name}`,
      sessionDuration,
      logoUrl,
      policies: [policyAdmins.id],
      tags,
    });
  }
}
