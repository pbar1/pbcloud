import * as crds from "../../crds/gen";
import * as pulumi from "@pulumi/pulumi";

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
    supplementalGroups?: Array<number>;
  };
  persistence?: {
    [index: string]: GeekCookbookValuesPersistence;
  };
  ingress?: {
    [index: string]: GeekCookbookValuesIngress;
  };
  hostNetwork?: boolean;
  secret?: {
    [index: string]: string;
  };
  additionalContainers?: {
    [index: string]: any;
  };
}

export interface GeekCookbookValuesPersistence {
  enabled?: boolean;
  type?: string;
  hostPath?: string;
  mountPath?: string;
  medium?: string;
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
  private persistence: { [index: string]: GeekCookbookValuesPersistence } = {};
  private env: { [index: string]: string } = {};
  private secret?: { [index: string]: string };
  private supplementalGroups?: Array<number>;
  private additionalContainers?: { [index: string]: any };

  private noHostNetwork = true;
  private noIngress = false;
  private noDropCaps = false;

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

  withEnv(env: { [index: string]: string }) {
    this.env = { ...this.env, ...env };
    return this;
  }

  withSecret(secret: { [index: string]: string }) {
    this.secret = { ...this.secret, ...secret };
    return this;
  }

  withAdditionalContainers(additionalContainers: { [index: string]: any }) {
    this.additionalContainers = {
      ...this.additionalContainers,
      ...additionalContainers,
    };
    return this;
  }

  withSupplementalGroups(supplementalGroups: Array<number>) {
    this.supplementalGroups = supplementalGroups;
    return this;
  }

  enableHostNetwork() {
    this.noHostNetwork = false;
    return this;
  }

  disableIngress() {
    this.noIngress = true;
    return this;
  }

  disableDropCaps() {
    this.noDropCaps = true;
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
    const ingress = this.noIngress
      ? {
          main: { enabled: false },
        }
      : {
          main: {
            enabled: true,
            annotations: {
              "cert-manager.io/cluster-issuer": "letsencrypt-production",
              "traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
            },
            hosts: [{ host, paths: [{ path: "/", pathType: "Prefix" }] }],
            tls: [{ hosts: [host], secretName: `${this.name}-tls` }],
          },
        };
    const env = {
      TZ: this.tz,
      PUID: this.puid,
      PGID: this.pgid,
      ...this.env,
    };

    return {
      image: {
        repository,
        tag: this.tag,
        imagePullPolicy: this.imagePullPolicy,
      },
      env,
      podAnnotations: {
        [`container.apparmor.security.beta.kubernetes.io/${this.name}`]:
          "unconfined",
      },
      podSecurityContext: {
        fsGroup: this.pgid,
        fsGroupChangePolicy: "OnRootMismatch",
        capabilities: this.noDropCaps ? undefined : { drop: ["all"] },
        seccompProfile: { type: "RuntimeDefault" },
        supplementalGroups: this.supplementalGroups,
      },
      persistence,
      ingress,
      hostNetwork: this.noHostNetwork ? undefined : true,
      secret: this.secret,
      additionalContainers: this.additionalContainers,
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

export class EmptyDirPersistence implements GeekCookbookValuesPersistence {
  enabled = true;
  type = "emptyDir";
  medium = "Memory";
  mountPath?: string;
}

export class NewGkHelmReleaseArgs {
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

export function newGkHelmRelease(
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
