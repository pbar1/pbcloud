import * as kplus from "cdk8s-plus-30";
import { PGID, PUID, TZ } from "../constants.ts";
import { NamespaceChart, envValues, nameFromImage } from "../util.ts";
import { basename } from "node:path";

export function create(ns: NamespaceChart) {
  hotio(ns, "ghcr.io/hotio/prowlarr:nightly", 9696);

  hotio(ns, "ghcr.io/hotio/sonarr:nightly", 8989, {
    "/downloads": "/data/torrents",
    "/recycle-bin": "/data/media/recycle-bin",
    "/tv": "/data/media/tv",
  });

  hotio(ns, "ghcr.io/hotio/radarr:nightly", 7878, {
    "/downloads": "/data/torrents",
    "/recycle-bin": "/data/media/recycle-bin",
    "/movies": "/data/media/movies",
  });

  hotio(ns, "ghcr.io/hotio/readarr:nightly", 8787, {
    "/downloads": "/data/torrents",
    "/recycle-bin": "/data/media/recycle-bin",
    "/audiobooks": "/data/media/audiobooks",
  });

  hotio(ns, "ghcr.io/hotio/lidarr:nightly", 8686, {
    "/downloads": "/data/torrents",
    "/recycle-bin": "/data/media/recycle-bin",
    "/music": "/data/media/music",
  });

  hotio(ns, "ghcr.io/hotio/bazarr:latest", 6767, {
    "/tv": "/data/media/tv",
    "/movies": "/data/media/movies",
  });

  hotio(ns, "ghcr.io/hotio/tautulli:latest", 8181);
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
  container.mount(
    "/config",
    kplus.Volume.fromHostPath(ns, `${name}-config`, "config", {
      path: `/zssd/general/config/${name}`,
    }),
  );

  deployment.exposeViaService({ name });
}
