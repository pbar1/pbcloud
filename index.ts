import * as pbcloud from "./source/lib/pbcloud";
import { HostPathPersistence } from "./source/lib/pbcloud";
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

const prowlarr = mediaGeekCookbookHelmReleaseBuilder
  .clone()
  .withChart("prowlarr")
  .withValues(
    new pbcloud.GeekCookbookValuesBuilder().withName("prowlarr").build()
  )
  .build();
