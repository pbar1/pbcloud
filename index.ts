import * as crds from "./source/crds/gen";
import { CustomResourceBuilder } from "./source/lib/customResourceBuilder";
import {
  HostPathPersistence,
  EmptyDirPersistence,
  GeekCookbookValuesBuilder,
  HelmReleaseBuilder,
  HelmRepositoryBuilder,
} from "./source/lib/helm";
import { K8sNamespaceRender } from "./source/lib/pbcloud";

// [Namespace] flux-system ----------------------------------------------------

let fluxSystemOpts = { parent: new K8sNamespaceRender("flux-system") };

const helmRepoBuilder = new CustomResourceBuilder(
  crds.source.v1beta2.HelmRepository,
  ""
)
  .withOpts(fluxSystemOpts)
  .withArgs({
    metadata: { namespace: "flux-system" },
    spec: { interval: "24h" },
  });

const repos = {
  "amd-gpu": "https://radeonopencompute.github.io/k8s-device-plugin",
  "external-dns": "https://kubernetes-sigs.github.io/external-dns",
  "geek-cookbook": "https://geek-cookbook.github.io/charts",
  gitea: "https://dl.gitea.io/charts/",
  grafana: "https://grafana.github.io/helm-charts",
  jetstack: "https://charts.jetstack.io",
  mvisonneau: "https://charts.visonneau.fr",
  "prometheus-community": "https://prometheus-community.github.io/helm-charts",
  weaveworks: "oci://ghcr.io/weaveworks/charts",
};

for (const [name, url] of Object.entries(repos)) {
  const type = url.includes("oci://") ? "oci" : undefined;
  helmRepoBuilder
    .clone()
    .withName(name)
    .withArgs({ metadata: { name }, spec: { url, type } })
    .build();
}

// [Namespace] media ----------------------------------------------------------

let mediaOpts = { parent: new K8sNamespaceRender("media") };

const hpDownloads = new HostPathPersistence("/data/torrents", "/downloads");
const hpTv = new HostPathPersistence("/data/media/tv", "/tv");
const hpMovies = new HostPathPersistence("/data/media/movies", "/movies");
const hpAudiobooks = new HostPathPersistence(
  "/data/media/audiobooks",
  "/audiobooks"
);

// const mediaGeekCookbookHelmReleaseBuilder = new HelmReleaseBuilder()
//   .withOpts(mediaOpts)
//   .withNamespace("media")
//   .withChartRepo("geek-cookbook");

const mediaGeekCookbookHelmReleaseBuilder = new CustomResourceBuilder(
  crds.helm.v2beta1.HelmRelease,
  ""
)
  .withOpts(mediaOpts)
  .withArgs({
    metadata: { namespace: "media" },
    spec: {
      interval: "24h",
      chart: {
        spec: {
          sourceRef: {
            name: "geek-cookbook",
            namespace: "flux-system",
            kind: "HelmRepository",
          },
        },
      },
    },
  });

const prowlarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withName("prowlarr")
  .withArgs({
    metadata: { name: "prowlarr" },
    spec: {
      chart: { spec: { chart: "prowlarr" } },
      values: new GeekCookbookValuesBuilder().withName("prowlarr").build(),
    },
  })
  .build();

const sonarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withName("sonarr")
  .withArgs({
    metadata: { name: "sonarr" },
    spec: {
      chart: { spec: { chart: "sonarr" } },
      values: new GeekCookbookValuesBuilder()
        .withName("sonarr")
        .withPersistence({
          media: hpTv,
          downloads: hpDownloads,
        })
        .build(),
    },
  })
  .build();

const radarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withName("radarr")
  .withArgs({
    metadata: { name: "radarr" },
    spec: {
      chart: { spec: { chart: "radarr" } },
      values: new GeekCookbookValuesBuilder()
        .withName("radarr")
        .withPersistence({
          media: hpMovies,
          downloads: hpDownloads,
        })
        .build(),
    },
  })
  .build();

const readarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withName("readarr")
  .withArgs({
    metadata: { name: "readarr" },
    spec: {
      chart: { spec: { chart: "readarr" } },
      values: new GeekCookbookValuesBuilder()
        .withName("readarr")
        .withTag("develop")
        .withPersistence({
          media: hpAudiobooks,
          downloads: hpDownloads,
        })
        .build(),
    },
  })
  .build();

// const bazarr = mediaGeekCookbookHelmReleaseBuilder
//   .clone()
//   .withChart("bazarr")
//   .withValues(
//     new GeekCookbookValuesBuilder()
//       .withName("bazarr")
//       .withPersistence({
//         tv: hpTv,
//         movies: hpMovies,
//       })
//       .build()
//   )
//   .build();

// // Supplemental groups are for GPU support and were found using:
// // $ cat /etc/group | grep "video\|render"
// // video:x:26:
// // render:x:303:
// // TODO: resources: { limits: { 'amd.com/gpu': 1 } }
// const plex = mediaGeekCookbookHelmReleaseBuilder
//   .clone()
//   .withChart("plex")
//   .withValues(
//     new GeekCookbookValuesBuilder()
//       .withName("plex")
//       .withPersistence({
//         transcode: new EmptyDirPersistence(),
//         tv: hpTv,
//         movies: hpMovies,
//         audiobooks: hpAudiobooks,
//       })
//       .withSupplementalGroups([26, 303])
//       .disableDropCaps()
//       .disableIngress()
//       .enableHostNetwork()
//       .build()
//   )
//   .build();

// const mullvadPort = "55487";
// // TODO: Abstract additionalContainers
// const gluetunCtr = {
//   name: "gluetun",
//   image: "qmcgaw/gluetun",
//   securityContext: { capabilities: { add: ["NET_ADMIN"] } },
//   envFrom: [{ secretRef: { name: "qbittorrent" } }],
//   env: [
//     { name: "TZ", value: "America/Los_Angeles" },
//     { name: "VPN_SERVICE_PROVIDER", value: "mullvad" },
//     { name: "VPN_TYPE", value: "wireguard" },
//     { name: "WIREGUARD_ADDRESSES", value: "10.67.247.61/32" },
//     { name: "SERVER_CITIES", value: "Zurich" },
//     { name: "OWNED_ONLY", value: "yes" },
//     { name: "FIREWALL_VPN_INPUT_PORTS", value: mullvadPort },
//     // VPN health check failures take down port and breaks qBittorrent
//     // https://github.com/qdm12/gluetun/issues/1407
//     // FIXME: On qBittorrent restart, existing torrents may startup and
//     // connect to peers WITH A NON-VPN IP ADDRESS! Also, if a torrent is
//     // added after the restart, it may still stall. Due to timing issues
//     // the torrent port still needs to be kicked on the qBittorrent side.
//     { name: "HEALTH_VPN_DURATION_INITIAL", value: "120s" },
//   ],
// };
// const qbittorrent = mediaGeekCookbookHelmReleaseBuilder
//   .clone()
//   .withChart("qbittorrent")
//   .withValues(
//     new GeekCookbookValuesBuilder()
//       .withName("qbittorrent")
//       .withRepository("ghcr.io/hotio/qbittorrent")
//       .withPersistence({
//         downloads: hpDownloads,
//       })
//       .withEnv({ QBT_TORRENTING_PORT: mullvadPort })
//       .withSecret({ WIREGUARD_PRIVATE_KEY: "${MULLVAD_WG_PK}" })
//       .withAdditionalContainers({ gluetun: gluetunCtr })
//       .build()
//   )
//   .build();
