import "../lib/workload-ext";

import { Construct } from "constructs";

import * as pb from "../lib/pbcloud";
import { container } from "../lib/workload";

const NAME = "media";

export class Namespace extends pb.Namespace {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    container("ghcr.io/pbar1/prowlarr:latest")
      .withPort(pb.port(9696))
      .asArrWorkload()
      .withNamespace(name)
      .build(this);

    container("ghcr.io/pbar1/sonarr:latest")
      .withPort(pb.port(8989))
      .asArrWorkload()
      .withDownloadsMount()
      .withTvMount()
      .withNamespace(name)
      .build(this);

    container("ghcr.io/pbar1/radarr:latest")
      .withPort(pb.port(7878))
      .asArrWorkload()
      .withDownloadsMount()
      .withMoviesMount()
      .withNamespace(name)
      .build(this);

    container("ghcr.io/pbar1/readarr:latest")
      .withPort(pb.port(8787))
      .asArrWorkload()
      .withDownloadsMount()
      .withAudiobooksMount()
      .withNamespace(name)
      .build(this);

    container("ghcr.io/pbar1/lidarr:latest")
      .withPort(pb.port(8686))
      .asArrWorkload()
      .withDownloadsMount()
      .withMusicMount()
      .withNamespace(name)
      .build(this);

    container("ghcr.io/autobrr/autobrr:latest")
      .withPort(pb.port(7474))
      .withEnv(pb.env("AUTOBRR__HOST", "0.0.0.0"))
      .asArrWorkload()
      .withNamespace(name)
      .build(this);

    // TODO: https://www.procustodibus.com/blog/2022/10/wireguard-in-podman/
    const torrentPort = "21133";
    const wga = "10.184.150.109/32,fd7d:76ee:e68f:a993:38c6:c8f3:5d35:8c9/128";
    const gluetun = container("qmcgaw/gluetun:latest")
      .withSecurityContext({
        allowPrivilegeEscalation: false,
        capabilities: { add: ["NET_ADMIN"] },
      })
      .withEnvFrom({ secretRef: { name: "qbittorrent" } })
      .withEnv(pb.env("TZ", "America/Los_Angeles"))
      .withEnv(pb.env("VPN_SERVICE_PROVIDER", "airvpn"))
      .withEnv(pb.env("VPN_TYPE", "wireguard"))
      .withEnv(pb.env("WIREGUARD_ADDRESSES", wga))
      .withEnv(pb.env("SERVER_COUNTRIES", "Switzerland"))
      .withEnv(pb.env("FIREWALL_VPN_INPUT_PORTS", torrentPort))
      // VPN health check failures take down port and breaks qBittorrent
      // https://github.com/qdm12/gluetun/issues/1407
      // FIXME: On qBittorrent restart, existing torrents may startup and
      // connect to peers WITH A NON-VPN IP ADDRESS! Also, if a torrent is
      // added after the restart, it may still stall. Due to timing issues
      // the torrent port still needs to be kicked on the qBittorrent side.
      .withEnv(pb.env("HEALTH_VPN_DURATION_INITIAL", "120s"))
      .build();
    container("ghcr.io/hotio/qbittorrent:latest")
      .withPort(pb.port(8080))
      .withEnv(pb.env("QBT_TORRENTING_PORT", torrentPort))
      .asLinuxServerWorkload()
      .withPodAnnotations({
        "operator.1password.io/item-name": "qbittorrent",
        "operator.1password.io/item-path": "vaults/pbcloud/items/qbittorrent",
      })
      .withDownloadsMount()
      .withContainer(gluetun)
      .withNamespace(name)
      .build(this);

    container("ghcr.io/linuxserver/plex:latest")
      .withPort(pb.port(32400))
      .asLinuxServerWorkload()
      .withHostNetwork()
      .withTranscodeMount()
      .withTvMount()
      .withMoviesMount()
      .withAudiobooksMount()
      .withMusicMount()
      .withNamespace(name)
      .build(this);
  }
}

/**
 * Renders Kubernetes manifests for the given namespace.
 */
export function build() {
  const app = new pb.App(NAME);
  new Namespace(app, NAME);
  app.synth();
}
