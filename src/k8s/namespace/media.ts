import * as kplus from "cdk8s-plus-30";
import { PGID, PUID, TZ } from "../constants.ts";
import { NamespaceChart, envValues, nameFromImage } from "../util.ts";
import { basename } from "node:path";

export function create(ns: NamespaceChart) {
  hotio(ns, "prowlarr:nightly", 9696, {
    "/config": "/zssd/general/config/prowlarr",
  });

  hotio(ns, "ghcr.io/hotio/sonarr:nightly", 8989, {
    "/config": "/zssd/general/config/sonarr",
    "/downloads": "/data/torrents",
    "/tv": "/data/media/tv",
    "/recycle-bin": "/data/media/recycle-bin",
  });

  hotio(ns, "ghcr.io/hotio/radarr:nightly", 7878, {
    "/config": "/zssd/general/config/radarr",
    "/downloads": "/data/torrents",
    "/movies": "/data/media/movies",
    "/recycle-bin": "/data/media/recycle-bin",
  });

  hotio(ns, "ghcr.io/hotio/readarr:nightly", 7878, {
    "/config": "/zssd/general/config/readarr",
    "/downloads": "/data/torrents",
    "/audiobooks": "/data/media/audiobooks",
    "/recycle-bin": "/data/media/recycle-bin",
  });

  hotio(ns, "ghcr.io/hotio/lidarr:nightly", 7878, {
    "/config": "/zssd/general/config/lidarr",
    "/downloads": "/data/torrents",
    "/music": "/data/media/music",
    "/recycle-bin": "/data/media/recycle-bin",
  });
}

function hotio(
  ns: NamespaceChart,
  image: string,
  port: number,
  hostPaths: { [ctrPath: string]: string } = {},
) {
  const name = nameFromImage(image);
  const portNumber = port;

  const deployment = new kplus.Deployment(ns, name, {
    metadata: { name },
    replicas: 1,
    securityContext: { ensureNonRoot: false },
  });

  const container = deployment.addContainer({
    name,
    image,
    portNumber,
    envVariables: envValues({ TZ, PUID, PGID }),
    resources: {},
    securityContext: { ensureNonRoot: false },
  });

  for (const ctrPath in hostPaths) {
    const hostPath = hostPaths[ctrPath];
    if (!hostPath) {
      continue;
    }
    const volName = basename(ctrPath);
    container.mount(
      ctrPath,
      kplus.Volume.fromHostPath(ns, `${name}-${volName}`, volName, {
        path: hostPath,
      }),
    );
  }
  container.mount("/tmp", kplus.Volume.fromEmptyDir(ns, `${name}-tmp`, "tmp"));

  deployment.exposeViaService({ name });
}
