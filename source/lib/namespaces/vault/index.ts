import * as pbcloud from "../../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import { HelmReleaseArgs, HelmRelease } from "../../crds/fluxcd/helm/v2beta1";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "vault") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const chart = "vault";
    const values: VaultHelmChartValues = {
      injector: { enabled: false },
      server: {
        ingress: {
          enabled: true,
          annotations: {
            "cert-manager.io/cluster-issuer": "letsencrypt-production",
            "traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
          },
          hosts: [{ host: "vault.xnauts.net", paths: ["/"] }],
          tls: [{ secretName: "vault-tls", hosts: ["vault.xnauts.net"] }],
        },
        standalone: { enabled: true },
        dataStorage: { enabled: false },
      },
      agent: { enabled: false },
    };
    const releaseArgs: HelmReleaseArgs = {
      metadata: { namespace, name: chart },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart,
            sourceRef: {
              kind: "HelmRepository",
              name: "hashicorp",
              namespace: "flux-system",
            },
          },
        },
        values,
      },
    };
    new HelmRelease(chart, releaseArgs, opts);
  }
}

// https://github.com/hashicorp/vault-helm/blob/main/values.schema.json
declare interface VaultHelmChartValues {
  csi?: {
    agent?: {
      enabled?: boolean;
      extraArgs?: unknown[];
      image?: {
        pullPolicy?: string;
        repository?: string;
        tag?: string;
        [k: string]: unknown;
      };
      logFormat?: string;
      logLevel?: string;
      resources?: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    daemonSet?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      extraLabels?: {
        [k: string]: unknown;
      };
      kubeletRootDir?: string;
      providersDir?: string;
      securityContext?: {
        container?:
          | {
              [k: string]: unknown;
            }
          | string;
        pod?:
          | {
              [k: string]: unknown;
            }
          | string;
        [k: string]: unknown;
      };
      updateStrategy?: {
        maxUnavailable?: string;
        type?: string;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    debug?: boolean;
    enabled?: boolean | string;
    extraArgs?: unknown[];
    image?: {
      pullPolicy?: string;
      repository?: string;
      tag?: string;
      [k: string]: unknown;
    };
    livenessProbe?: {
      failureThreshold?: number;
      initialDelaySeconds?: number;
      periodSeconds?: number;
      successThreshold?: number;
      timeoutSeconds?: number;
      [k: string]: unknown;
    };
    pod?: {
      affinity?:
        | null
        | {
            [k: string]: unknown;
          }
        | string;
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      extraLabels?: {
        [k: string]: unknown;
      };
      nodeSelector?:
        | null
        | {
            [k: string]: unknown;
          }
        | string;
      tolerations?: null | unknown[] | string;
      [k: string]: unknown;
    };
    priorityClassName?: string;
    readinessProbe?: {
      failureThreshold?: number;
      initialDelaySeconds?: number;
      periodSeconds?: number;
      successThreshold?: number;
      timeoutSeconds?: number;
      [k: string]: unknown;
    };
    resources?: {
      [k: string]: unknown;
    };
    serviceAccount?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      extraLabels?: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    volumeMounts?: null | unknown[];
    volumes?: null | unknown[];
    [k: string]: unknown;
  };
  global?: {
    enabled?: boolean;
    externalVaultAddr?: string;
    imagePullSecrets?: unknown[];
    openshift?: boolean;
    psp?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enable?: boolean;
      [k: string]: unknown;
    };
    tlsDisable?: boolean;
    [k: string]: unknown;
  };
  injector?: {
    affinity?:
      | {
          [k: string]: unknown;
        }
      | string;
    agentDefaults?: {
      cpuLimit?: string;
      cpuRequest?: string;
      memLimit?: string;
      memRequest?: string;
      ephemeralLimit?: string;
      ephemeralRequest?: string;
      template?: string;
      templateConfig?: {
        exitOnRetryFailure?: boolean;
        staticSecretRenderInterval?: string;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    agentImage?: {
      repository?: string;
      tag?: string;
      [k: string]: unknown;
    };
    annotations?:
      | {
          [k: string]: unknown;
        }
      | string;
    authPath?: string;
    certs?: {
      caBundle?: string;
      certName?: string;
      keyName?: string;
      secretName?: null | string;
      [k: string]: unknown;
    };
    enabled?: boolean | string;
    externalVaultAddr?: string;
    extraEnvironmentVars?: {
      [k: string]: unknown;
    };
    extraLabels?: {
      [k: string]: unknown;
    };
    failurePolicy?: string;
    hostNetwork?: boolean;
    image?: {
      pullPolicy?: string;
      repository?: string;
      tag?: string;
      [k: string]: unknown;
    };
    leaderElector?: {
      enabled?: boolean;
      [k: string]: unknown;
    };
    logFormat?: string;
    logLevel?: string;
    metrics?: {
      enabled?: boolean;
      [k: string]: unknown;
    };
    namespaceSelector?: {
      [k: string]: unknown;
    };
    nodeSelector?:
      | null
      | {
          [k: string]: unknown;
        }
      | string;
    objectSelector?:
      | {
          [k: string]: unknown;
        }
      | string;
    podDisruptionBudget?: {
      [k: string]: unknown;
    };
    port?: number;
    priorityClassName?: string;
    replicas?: number;
    resources?: {
      [k: string]: unknown;
    };
    revokeOnShutdown?: boolean;
    securityContext?: {
      container?:
        | {
            [k: string]: unknown;
          }
        | string;
      pod?:
        | {
            [k: string]: unknown;
          }
        | string;
      [k: string]: unknown;
    };
    service?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      [k: string]: unknown;
    };
    serviceAccount?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      [k: string]: unknown;
    };
    strategy?:
      | {
          [k: string]: unknown;
        }
      | string;
    tolerations?: null | unknown[] | string;
    topologySpreadConstraints?: null | unknown[] | string;
    webhook?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      failurePolicy?: string;
      matchPolicy?: string;
      namespaceSelector?: {
        [k: string]: unknown;
      };
      objectSelector?:
        | {
            [k: string]: unknown;
          }
        | string;
      timeoutSeconds?: number;
      [k: string]: unknown;
    };
    webhookAnnotations?:
      | {
          [k: string]: unknown;
        }
      | string;
    [k: string]: unknown;
  };
  server?: {
    affinity?:
      | {
          [k: string]: unknown;
        }
      | string;
    annotations?:
      | {
          [k: string]: unknown;
        }
      | string;
    auditStorage?: {
      accessMode?: string;
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enabled?: boolean | string;
      mountPath?: string;
      size?: string;
      storageClass?: null | string;
      [k: string]: unknown;
    };
    authDelegator?: {
      enabled?: boolean;
      [k: string]: unknown;
    };
    dataStorage?: {
      accessMode?: string;
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enabled?: boolean | string;
      mountPath?: string;
      size?: string;
      storageClass?: null | string;
      [k: string]: unknown;
    };
    dev?: {
      devRootToken?: string;
      enabled?: boolean;
      [k: string]: unknown;
    };
    enabled?: boolean | string;
    enterpriseLicense?: {
      secretKey?: string;
      secretName?: string;
      [k: string]: unknown;
    };
    extraArgs?: string;
    extraPorts?: null | unknown[];
    extraContainers?: null | unknown[];
    extraEnvironmentVars?: {
      [k: string]: unknown;
    };
    extraInitContainers?: null | unknown[];
    extraLabels?: {
      [k: string]: unknown;
    };
    extraSecretEnvironmentVars?: unknown[];
    extraVolumes?: unknown[];
    ha?: {
      apiAddr?: null | string;
      clusterAddr?: null | string;
      config?:
        | string
        | {
            [k: string]: unknown;
          };
      disruptionBudget?: {
        enabled?: boolean;
        maxUnavailable?: null | number;
        [k: string]: unknown;
      };
      enabled?: boolean;
      raft?: {
        config?:
          | string
          | {
              [k: string]: unknown;
            };
        enabled?: boolean;
        setNodeId?: boolean;
        [k: string]: unknown;
      };
      replicas?: number;
      [k: string]: unknown;
    };
    image?: {
      pullPolicy?: string;
      repository?: string;
      tag?: string;
      [k: string]: unknown;
    };
    ingress?: {
      activeService?: boolean;
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enabled?: boolean;
      extraPaths?: unknown[];
      hosts?: {
        host?: string;
        paths?: unknown[];
        [k: string]: unknown;
      }[];
      ingressClassName?: string;
      labels?: {
        [k: string]: unknown;
      };
      pathType?: string;
      tls?: unknown[];
      [k: string]: unknown;
    };
    livenessProbe?: {
      enabled?: boolean;
      failureThreshold?: number;
      initialDelaySeconds?: number;
      path?: string;
      periodSeconds?: number;
      successThreshold?: number;
      timeoutSeconds?: number;
      [k: string]: unknown;
    };
    logFormat?: string;
    logLevel?: string;
    networkPolicy?: {
      egress?: unknown[];
      enabled?: boolean;
      [k: string]: unknown;
    };
    nodeSelector?:
      | null
      | {
          [k: string]: unknown;
        }
      | string;
    postStart?: unknown[];
    preStopSleepSeconds?: number;
    priorityClassName?: string;
    readinessProbe?: {
      enabled?: boolean;
      failureThreshold?: number;
      initialDelaySeconds?: number;
      periodSeconds?: number;
      successThreshold?: number;
      timeoutSeconds?: number;
      [k: string]: unknown;
    };
    resources?: {
      [k: string]: unknown;
    };
    route?: {
      activeService?: boolean;
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enabled?: boolean;
      host?: string;
      labels?: {
        [k: string]: unknown;
      };
      tls?: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    service?: {
      active?: {
        enabled?: boolean;
        [k: string]: unknown;
      };
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      enabled?: boolean;
      externalTrafficPolicy?: string;
      instanceSelector?: {
        enabled?: boolean;
        [k: string]: unknown;
      };
      port?: number;
      publishNotReadyAddresses?: boolean;
      standby?: {
        enabled?: boolean;
        [k: string]: unknown;
      };
      targetPort?: number;
      nodePort?: number;
      activeNodePort?: number;
      standbyNodePort?: number;
      [k: string]: unknown;
    };
    serviceAccount?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      create?: boolean;
      extraLabels?: {
        [k: string]: unknown;
      };
      name?: string;
      serviceDiscovery?: {
        enabled?: boolean;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    shareProcessNamespace?: boolean;
    standalone?: {
      config?:
        | string
        | {
            [k: string]: unknown;
          };
      enabled?: string | boolean;
      [k: string]: unknown;
    };
    statefulSet?: {
      annotations?:
        | {
            [k: string]: unknown;
          }
        | string;
      securityContext?: {
        container?:
          | {
              [k: string]: unknown;
            }
          | string;
        pod?:
          | {
              [k: string]: unknown;
            }
          | string;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    terminationGracePeriodSeconds?: number;
    tolerations?: null | unknown[] | string;
    topologySpreadConstraints?: null | unknown[] | string;
    updateStrategyType?: string;
    volumeMounts?: null | unknown[];
    volumes?: null | unknown[];
    hostNetwork?: boolean;
    [k: string]: unknown;
  };
  serverTelemetry?: {
    prometheusRules?: {
      enabled?: boolean;
      rules?: unknown[];
      selectors?: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  ui?: {
    activeVaultPodOnly?: boolean;
    annotations?:
      | {
          [k: string]: unknown;
        }
      | string;
    enabled?: boolean | string;
    externalPort?: number;
    externalTrafficPolicy?: string;
    publishNotReadyAddresses?: boolean;
    serviceNodePort?: null | number;
    serviceType?: string;
    targetPort?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
