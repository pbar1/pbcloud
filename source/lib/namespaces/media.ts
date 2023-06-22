import * as crds from "../../crds/gen";
import {
  HostPathPersistence,
  EmptyDirPersistence,
  GeekCookbookValuesBuilder,
} from "../helm/geek_cookbook";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

const HP_DOWNLOADS = new HostPathPersistence("/data/torrents", "/downloads");
const HP_TV = new HostPathPersistence("/data/media/tv", "/tv");
const HP_MOVIES = new HostPathPersistence("/data/media/movies", "/movies");
const HP_AUDIOBOOKS = new HostPathPersistence(
  "/data/media/audiobooks",
  "/audiobooks"
);

const MULLVAD_PORT = "55487";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "media") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    newGkHelmRelease(
      {
        namespace,
        chart: "prowlarr",
        values: new GeekCookbookValuesBuilder().withName("sonarr").build(),
      },
      opts
    );

    newGkHelmRelease(
      {
        namespace,
        chart: "sonarr",
        values: new GeekCookbookValuesBuilder()
          .withName("sonarr")
          .withPersistence({
            media: HP_TV,
            downloads: HP_DOWNLOADS,
          })
          .build(),
      },
      opts
    );

    newGkHelmRelease(
      {
        namespace,
        chart: "radarr",
        values: new GeekCookbookValuesBuilder()
          .withName("radarr")
          .withPersistence({
            media: HP_MOVIES,
            downloads: HP_DOWNLOADS,
          })
          .build(),
      },
      opts
    );

    newGkHelmRelease(
      {
        namespace,
        chart: "readarr",
        values: new GeekCookbookValuesBuilder()
          .withName("readarr")
          .withTag("develop")
          .withPersistence({
            media: HP_AUDIOBOOKS,
            downloads: HP_DOWNLOADS,
          })
          .build(),
      },
      opts
    );

    newGkHelmRelease(
      {
        namespace,
        chart: "bazarr",
        values: new GeekCookbookValuesBuilder()
          .withName("bazarr")
          .withPersistence({
            tv: HP_TV,
            movies: HP_MOVIES,
          })
          .build(),
      },
      opts
    );

    // Supplemental groups are for GPU support and were found using:
    // $ cat /etc/group | grep "video\|render"
    // video:x:26:
    // render:x:303:
    // TODO: resources: { limits: { 'amd.com/gpu': 1 } }
    newGkHelmRelease(
      {
        namespace,
        chart: "plex",
        values: new GeekCookbookValuesBuilder()
          .withName("plex")
          .withPersistence({
            transcode: new EmptyDirPersistence(),
            tv: HP_TV,
            movies: HP_MOVIES,
            audiobooks: HP_AUDIOBOOKS,
          })
          .withSupplementalGroups([26, 303])
          .disableDropCaps()
          .disableIngress()
          .enableHostNetwork()
          .build(),
      },
      opts
    );

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
        { name: "FIREWALL_VPN_INPUT_PORTS", value: MULLVAD_PORT },
        // VPN health check failures take down port and breaks qBittorrent
        // https://github.com/qdm12/gluetun/issues/1407
        // FIXME: On qBittorrent restart, existing torrents may startup and
        // connect to peers WITH A NON-VPN IP ADDRESS! Also, if a torrent is
        // added after the restart, it may still stall. Due to timing issues
        // the torrent port still needs to be kicked on the qBittorrent side.
        { name: "HEALTH_VPN_DURATION_INITIAL", value: "120s" },
      ],
    };
    newGkHelmRelease(
      {
        namespace,
        chart: "qbittorrent",
        values: new GeekCookbookValuesBuilder()
          .withName("qbittorrent")
          .withRepository("ghcr.io/hotio/qbittorrent")
          .withPersistence({
            downloads: new HostPathPersistence(
              "/data/torrents/qbittorrent",
              "/downloads/qbittorrent"
            ),
          })
          .withEnv({ QBT_TORRENTING_PORT: MULLVAD_PORT })
          .withSecret({ WIREGUARD_PRIVATE_KEY: "${MULLVAD_WG_PK}" }) // FIXME: No Flux injection
          .withAdditionalContainers({ gluetun: gluetunCtr })
          .build(),
      },
      opts
    );
  }
}

class NewGkHelmReleaseArgs {
  name?: string;
  namespace: string;
  chart: string;
  chartRepo?: string;
  values: any = {};

  constructor(namespace: string, chart: string) {
    this.namespace = namespace;
    this.chart = chart;
  }
}

function newGkHelmRelease(
  args: NewGkHelmReleaseArgs,
  opts: pulumi.ComponentResourceOptions
): crds.helm.v2beta1.HelmRelease {
  const name = args.name ?? args.chart;
  const chartRepo = args.chartRepo ?? "geek-cookbook";

  const helmReleaseArgs: crds.helm.v2beta1.HelmReleaseArgs = {
    metadata: { name, namespace: args.namespace },
    spec: {
      interval: "24h",
      chart: {
        spec: {
          chart: args.chart,
          sourceRef: {
            kind: "HelmRepository",
            namespace: "flux-system",
            name: chartRepo,
          },
        },
      },
      values: args.values,
    },
  };

  return new crds.helm.v2beta1.HelmRelease(name, helmReleaseArgs, opts);
}
