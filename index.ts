import * as pbcloud from "./source/lib/pbcloud";
import { HostPathPersistence, EmptyDirPersistence } from "./source/lib/pbcloud";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

class K8sNamespaceRender extends pulumi.ComponentResource {
  constructor(namespace: string) {
    const k8sProvider = new k8s.Provider(namespace, {
      renderYamlToDirectory: `rendered/${namespace}`,
    });

    super(
      "pulumi:component:K8sNamespaceRender",
      namespace,
      {},
      { providers: [k8sProvider] }
    );

    new k8s.core.v1.Namespace(
      namespace,
      { metadata: { name: namespace } },
      { parent: this }
    );
  }
}

// [Namespace] flux-system ----------------------------------------------------

const fluxSystemOpts: pulumi.CustomResourceOptions = {
  parent: new K8sNamespaceRender("flux-system"),
};

const fluxSystemHelmRepositoryBuilder = new pbcloud.HelmRepositoryBuilder()
  .withOpts(fluxSystemOpts)
  .withNamespace("flux-system");

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
  fluxSystemHelmRepositoryBuilder.clone().withName(name).withUrl(url).build();
}

// [Namespace] media ----------------------------------------------------------

const mediaOpts: pulumi.CustomResourceOptions = {
  parent: new K8sNamespaceRender("media"),
};

const hpDownloads = new HostPathPersistence("/data/torrents", "/downloads");
const hpTv = new HostPathPersistence("/data/media/tv", "/tv");
const hpMovies = new HostPathPersistence("/data/media/movies", "/movies");
const hpAudiobooks = new HostPathPersistence(
  "/data/media/audiobooks",
  "/audiobooks"
);

const mediaGeekCookbookHelmReleaseBuilder = new pbcloud.HelmReleaseBuilder()
  .withOpts(mediaOpts)
  .withNamespace("media")
  .withChartRepo("geek-cookbook");

const prowlarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("prowlarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder().withName("prowlarr").build()
  )
  .build();

const sonarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("sonarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("sonarr")
      .withPersistence({
        media: hpTv,
        downloads: hpDownloads,
      })
      .build()
  )
  .build();

const radarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("radarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("radarr")
      .withPersistence({
        media: hpMovies,
        downloads: hpDownloads,
      })
      .build()
  )
  .build();

const readarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("readarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("readarr")
      .withTag("develop")
      .withPersistence({
        media: hpAudiobooks,
        downloads: hpDownloads,
      })
      .build()
  )
  .build();

const bazarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("bazarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("bazarr")
      .withPersistence({
        tv: hpTv,
        movies: hpMovies,
      })
      .build()
  )
  .build();

// Supplemental groups are for GPU support and were found using:
// $ cat /etc/group | grep "video\|render"
// video:x:26:
// render:x:303:
// TODO: resources: { limits: { 'amd.com/gpu': 1 } }
const plex = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("plex")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("plex")
      .withPersistence({
        transcode: new EmptyDirPersistence(),
        tv: hpTv,
        movies: hpMovies,
        audiobooks: hpAudiobooks,
      })
      .withSupplementalGroups([26, 303])
      .disableDropCaps()
      .disableIngress()
      .enableHostNetwork()
      .build()
  )
  .build();

const mullvadPort = "55487";
// TODO: Abstract additionalContainers
const gluetunCtr = {
  name: "gluetun",
  image: "qmcgaw/gluetun",
  securityContext: { capabilities: { add: ["NET_ADMIN"] } },
  envFrom: [{ secretRef: { name: "qbittorrent" } }],
  env: [
    { name: "TZ", value: "America/Los_Angeles" },
    { name: "VPN_SERVICE_PROVIDER", value: "mullvad" },
    { name: "VPN_TYPE", value: "wireguard" },
    { name: "WIREGUARD_ADDRESSES", value: "10.67.247.61/32" },
    { name: "SERVER_CITIES", value: "Zurich" },
    { name: "OWNED_ONLY", value: "yes" },
    { name: "FIREWALL_VPN_INPUT_PORTS", value: mullvadPort },
    // VPN health check failures take down port and breaks qBittorrent
    // https://github.com/qdm12/gluetun/issues/1407
    // FIXME: On qBittorrent restart, existing torrents may startup and
    // connect to peers WITH A NON-VPN IP ADDRESS! Also, if a torrent is
    // added after the restart, it may still stall. Due to timing issues
    // the torrent port still needs to be kicked on the qBittorrent side.
    { name: "HEALTH_VPN_DURATION_INITIAL", value: "120s" },
  ],
};
const qbittorrent = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("qbittorrent")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder()
      .withName("qbittorrent")
      .withRepository("ghcr.io/hotio/qbittorrent")
      .withPersistence({
        downloads: hpDownloads,
      })
      .withEnv({ QBT_TORRENTING_PORT: mullvadPort })
      .withSecret({ WIREGUARD_PRIVATE_KEY: "${MULLVAD_WG_PK}" })
      .withAdditionalContainers({ gluetun: gluetunCtr })
      .build()
  )
  .build();
