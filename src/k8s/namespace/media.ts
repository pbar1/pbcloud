import { ENV, GLUETUN, HOST_PATHS } from "../constants.ts";
import { NamespaceChart, envValues, run } from "../util.ts";
import { Capability, EmptyDirMedium, Env, Secret, Volume } from "cdk8s-plus-30";

const env = ENV;

export function create(ns: NamespaceChart) {
  run(ns, "ghcr.io/hotio/prowlarr:nightly", { port: 9696, env });

  run(ns, "ghcr.io/hotio/sonarr:nightly", {
    port: 8989,
    env,
    hostPaths: {
      ...HOST_PATHS.downloads,
      ...HOST_PATHS.recycleBin,
      ...HOST_PATHS.tv,
    },
  });

  run(ns, "ghcr.io/hotio/radarr:nightly", {
    port: 7878,
    env,
    hostPaths: {
      ...HOST_PATHS.downloads,
      ...HOST_PATHS.recycleBin,
      ...HOST_PATHS.movies,
    },
  });

  run(ns, "ghcr.io/hotio/readarr:nightly", {
    port: 8787,
    env,
    hostPaths: {
      ...HOST_PATHS.downloads,
      ...HOST_PATHS.recycleBin,
      ...HOST_PATHS.audiobooks,
    },
  });

  run(ns, "ghcr.io/hotio/lidarr:nightly", {
    port: 8686,
    env,
    hostPaths: {
      ...HOST_PATHS.downloads,
      ...HOST_PATHS.recycleBin,
      ...HOST_PATHS.music,
    },
  });

  run(ns, "ghcr.io/hotio/bazarr:latest", {
    port: 6767,
    env,
    hostPaths: {
      ...HOST_PATHS.tv,
      ...HOST_PATHS.movies,
    },
  });

  run(ns, "ghcr.io/hotio/tautulli:latest", { port: 8181, env });

  run(ns, "ghcr.io/flaresolverr/flaresolverr:latest", {
    port: 8191,
    env: { TZ: env.TZ },
    securityContextContainer: {
      readOnlyRootFilesystem: false,
      ensureNonRoot: false,
    },
  });

  const plex = run(ns, "ghcr.io/linuxserver/plex", {
    port: 32400,
    env,
    hostPaths: {
      ...HOST_PATHS.tv,
      ...HOST_PATHS.movies,
      ...HOST_PATHS.audiobooks,
      ...HOST_PATHS.music,
      ...HOST_PATHS.youtube,
    },
    hostNetwork: true,
  });
  plex.containers[0]?.mount(
    "/transcode",
    Volume.fromEmptyDir(ns, "plex-transcode", "transcode", {
      medium: EmptyDirMedium.MEMORY,
    }),
  );

  const qbt = run(ns, "ghcr.io/hotio/qbittorrent:latest", {
    port: 8080,
    env: {
      ...env,
      QBT_TORRENTING_PORT: GLUETUN.FIREWALL_VPN_INPUT_PORTS,
    },
    hostPaths: {
      ...HOST_PATHS.downloads,
    },
    securityContextContainer: {
      readOnlyRootFilesystem: false,
      ensureNonRoot: false,
    },
  });
  qbt.podMetadata.addAnnotation(
    "operator.1password.io/item-name",
    "qbittorrent",
  );
  qbt.podMetadata.addAnnotation(
    "operator.1password.io/item-path",
    "vaults/pbcloud/items/qbittorrent",
  );
  qbt.addContainer({
    name: "gluetun",
    image: "qmcgaw/gluetun:latest",
    envVariables: envValues(GLUETUN),
    envFrom: [
      Env.fromSecret(Secret.fromSecretName(ns, "gluetun", "qbittorrent")),
    ],
    resources: {},
    securityContext: {
      capabilities: { add: [Capability.NET_ADMIN] },
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
  });
}
