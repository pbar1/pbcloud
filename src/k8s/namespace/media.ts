import * as kplus from "cdk8s-plus-30";
import { HOST_PATHS, PGID, PUID, TZ } from "../constants.ts";
import { NamespaceChart, envValues, nameFromImage } from "../util.ts";
import { basename } from "node:path";

export function create(ns: NamespaceChart) {
  run(ns, "ghcr.io/hotio/prowlarr:nightly", 9696);

  run(ns, "ghcr.io/hotio/sonarr:nightly", 8989, {
    ...HOST_PATHS.downloads,
    ...HOST_PATHS.recycleBin,
    ...HOST_PATHS.tv,
  });

  run(ns, "ghcr.io/hotio/radarr:nightly", 7878, {
    ...HOST_PATHS.downloads,
    ...HOST_PATHS.recycleBin,
    ...HOST_PATHS.movies,
  });

  run(ns, "ghcr.io/hotio/readarr:nightly", 8787, {
    ...HOST_PATHS.downloads,
    ...HOST_PATHS.recycleBin,
    ...HOST_PATHS.audiobooks,
  });

  run(ns, "ghcr.io/hotio/lidarr:nightly", 8686, {
    ...HOST_PATHS.downloads,
    ...HOST_PATHS.recycleBin,
    ...HOST_PATHS.music,
  });

  run(ns, "ghcr.io/hotio/bazarr:latest", 6767, {
    ...HOST_PATHS.tv,
    ...HOST_PATHS.movies,
  });

  run(ns, "ghcr.io/hotio/tautulli:latest", 8181);

  run(
    ns,
    "ghcr.io/linuxserver/plex",
    32400,
    {
      ...HOST_PATHS.tv,
      ...HOST_PATHS.movies,
      ...HOST_PATHS.audiobooks,
      ...HOST_PATHS.music,
      ...HOST_PATHS.youtube,
    },
    true,
  );
}

function run(
  ns: NamespaceChart,
  image: string,
  port: number,
  hostPaths: { [ctrPath: string]: string } = {},
  hostNetwork = false,
): kplus.Deployment {
  const name = nameFromImage(image);
  const portNumber = port;

  const deployment = new kplus.Deployment(ns, name, {
    metadata: { name },
    replicas: 1,
    securityContext: { ensureNonRoot: false },
    hostNetwork,
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

  return deployment;
}
