import { HelmRelease, HelmReleaseArgs } from "../crds/gen/helm/v2beta1";
import { HelmRepository, HelmRepositoryArgs } from "../crds/gen/source/v1beta2";
import * as pulumi from "@pulumi/pulumi";

// Helm -----------------------------------------------------------------------

export class HelmRepositoryBuilder {
  private opts?: pulumi.CustomResourceOptions;
  private namespace?: string;
  private name?: string;
  private url?: string;
  private interval: string = "24h";

  withOpts(opts: pulumi.CustomResourceOptions) {
    this.opts = opts;
    return this;
  }

  withNamespace(namespace: string) {
    this.namespace = namespace;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  withUrl(url: string) {
    this.url = url;
    return this;
  }

  withInterval(interval: string) {
    this.interval = interval;
    return this;
  }

  clone(): HelmRepositoryBuilder {
    let copy = new HelmRepositoryBuilder();

    copy.opts = this.opts;
    copy.namespace = this.namespace;
    copy.name = this.name;
    copy.url = this.url;
    copy.interval = this.interval;

    return copy;
  }

  build(): HelmRepository {
    if (this.name === undefined) {
      throw new Error("name must be set");
    }
    if (this.url === undefined) {
      throw new Error("url must be set");
    }

    const repoType = this.url.includes("oci://") ? "oci" : undefined;

    const args: HelmRepositoryArgs = {
      metadata: {
        name: this.name,
        namespace: this.namespace,
      },
      spec: {
        url: this.url,
        type: repoType,
        interval: this.interval,
      },
    };

    return new HelmRepository(this.name, args, this.opts);
  }
}

export class HelmReleaseBuilder {
  private opts?: pulumi.CustomResourceOptions;
  private chartRepo?: string;
  private chart?: string;
  private namespace?: string;
  private name?: string;
  private interval: string = "24h";
  private sourceRefNamespace: string = "flux-system";
  private sourceRefKind: string = "HelmRepository";
  private values: any = {};

  withOpts(opts: pulumi.CustomResourceOptions) {
    this.opts = opts;
    return this;
  }

  withChartRepo(chartRepo: string) {
    this.chartRepo = chartRepo;
    return this;
  }

  withChart(chart: string) {
    this.chart = chart;
    return this;
  }

  withNamespace(namespace: string) {
    this.namespace = namespace;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  withInterval(interval: string) {
    this.interval = interval;
    return this;
  }

  withSourceRefNamespace(sourceRefNamespace: string) {
    this.sourceRefNamespace = sourceRefNamespace;
    return this;
  }

  withValues(values: any) {
    this.values = values;
    return this;
  }

  clone(): HelmReleaseBuilder {
    let copy = new HelmReleaseBuilder();

    copy.opts = this.opts;
    copy.chartRepo = this.chartRepo;
    copy.chart = this.chart;
    copy.namespace = this.namespace;
    copy.name = this.name;
    copy.interval = this.interval;
    copy.sourceRefNamespace = this.sourceRefNamespace;
    copy.sourceRefKind = this.sourceRefKind;
    copy.values = this.values;

    return copy;
  }

  build(): HelmRelease {
    if (this.chartRepo === undefined) {
      throw new Error("chartRepo must be set");
    }
    if (this.chart === undefined) {
      throw new Error("chart must be set");
    }

    const name = this.name ?? this.chart;

    const args: HelmReleaseArgs = {
      metadata: {
        name: name,
        namespace: this.namespace,
      },
      spec: {
        interval: this.interval,
        chart: {
          spec: {
            chart: this.chart,
            sourceRef: {
              name: this.chartRepo,
              namespace: this.sourceRefNamespace,
              kind: this.sourceRefKind,
            },
          },
        },
        values: this.values,
      },
    };

    return new HelmRelease(name, args, this.opts);
  }
}

// Geek Cookbook --------------------------------------------------------------

export interface GeekCookbookValues {
  image?: {
    repository?: string;
    tag?: string;
    imagePullPolicy?: string;
  };
  env?: {
    TZ?: string;
    PUID?: string;
    PGID?: string;
  };
  podAnnotations?: {
    [index: string]: string;
  };
  podSecurityContext?: {
    fsGroup?: string;
    fsGroupChangePolicy?: string;
    capabilities?: {
      drop?: Array<string>;
    };
    seccompProfile?: {
      type?: string;
    };
  };
  persistence?: {
    [index: string]: GeekCookbookValuesPersistence;
  };
  ingress?: {
    [index: string]: GeekCookbookValuesIngress;
  };
}

export interface GeekCookbookValuesPersistence {
  enabled?: boolean;
  type?: string;
  hostPath?: string;
  mountPath?: string;
}

export interface GeekCookbookValuesIngress {
  enabled?: boolean;
  annotations?: {};
  hosts?: Array<GeekCookbookValuesIngressHost>;
  tls?: Array<GeekCookbookValuesIngressTls>;
}

export interface GeekCookbookValuesIngressHost {
  host: string;
  paths: Array<GeekCookbookValuesIngressHostPath>;
}

export interface GeekCookbookValuesIngressHostPath {
  path: string;
  pathType?: string;
}

export interface GeekCookbookValuesIngressTls {
  hosts: Array<string>;
  secretName: string;
}

export class GeekCookbookValuesBuilder {
  private name?: string;
  private repository?: string;
  private tag: string = "latest";
  private imagePullPolicy: string = "Always";
  private tz: string = "America/Los_Angeles";
  private puid: string = "1000";
  private pgid: string = "100";
  private configHostPath?: string;
  private configMountPath: string = "/config";
  private host?: string;

  private persistence: {
    [index: string]: GeekCookbookValuesPersistence;
  } = {};

  withName(name: string) {
    this.name = name;
    return this;
  }

  withRepository(repository: string) {
    this.repository = repository;
    return this;
  }

  withTag(tag: string) {
    this.tag = tag;
    return this;
  }

  withImagePullPolicy(imagePullPolicy: string) {
    this.imagePullPolicy = imagePullPolicy;
    return this;
  }

  withTz(tz: string) {
    this.tz = tz;
    return this;
  }

  withPuid(puid: string) {
    this.puid = puid;
    return this;
  }

  withPgid(pgid: string) {
    this.pgid = pgid;
    return this;
  }

  withConfigHostPath(configHostPath: string) {
    this.configHostPath = configHostPath;
    return this;
  }

  withConfigMountPath(configMountPath: string) {
    this.configMountPath = configMountPath;
    return this;
  }

  withHost(host: string) {
    this.host = host;
    return this;
  }

  withPersistence(persistence: {
    [index: string]: GeekCookbookValuesPersistence;
  }) {
    this.persistence = { ...this.persistence, ...persistence };
    return this;
  }

  clone(): GeekCookbookValuesBuilder {
    return Object.assign({}, this);
  }

  build(): GeekCookbookValues {
    if (this.name === undefined) {
      throw new Error("name must be set");
    }

    const repository = this.repository ?? `ghcr.io/linuxserver/${this.name}`;
    const configHostPath =
      this.configHostPath ?? `/data/general/config/${this.name}`;
    const host = this.host ?? `${this.name}.xnauts.net`; // FIXME: Extract
    const persistence = {
      config: {
        enabled: true,
        type: "hostPath",
        hostPath: configHostPath,
        mountPath: this.configMountPath,
      },
      ...this.persistence,
    };

    return {
      image: {
        repository,
        tag: this.tag,
        imagePullPolicy: this.imagePullPolicy,
      },
      env: {
        TZ: this.tz,
        PUID: this.puid,
        PGID: this.pgid,
      },
      podAnnotations: {
        [`container.apparmor.security.beta.kubernetes.io/${this.name}`]:
          "unconfined",
      },
      podSecurityContext: {
        fsGroup: this.pgid,
        fsGroupChangePolicy: "OnRootMismatch",
        capabilities: { drop: ["all"] },
        seccompProfile: { type: "RuntimeDefault" },
      },
      persistence,
      ingress: {
        main: {
          enabled: true,
          annotations: {
            "cert-manager.io/cluster-issuer": "letsencrypt-production",
            "traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
          },
          hosts: [{ host, paths: [{ path: "/", pathType: "Prefix" }] }],
          tls: [{ hosts: [host], secretName: `${this.name}-tls` }],
        },
      },
    };
  }
}

export class HostPathPersistence implements GeekCookbookValuesPersistence {
  enabled: boolean = true;
  type: string = "hostPath";
  hostPath: string;
  mountPath: string;

  constructor(hostPath: string, mountPath: string) {
    this.hostPath = hostPath;
    this.mountPath = mountPath;
  }
}
