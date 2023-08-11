import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as cf from "../crds/cloudflare";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "atuin") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const name = namespace;
    const labels = { app: name };
    const atuinPort = 8888;
    const pgDatabase = "postgres";
    const pgSockDir = "/pgsocket";
    const sockMount = { name: "pgsocket", mountPath: pgSockDir };

    const deployArgs: k8s.apps.v1.DeploymentArgs = {
      metadata: { namespace, name, labels },
      spec: {
        replicas: 1,
        selector: { matchLabels: labels },
        template: {
          metadata: { labels },
          spec: {
            containers: [
              {
                name: "atuin",
                image: "ghcr.io/atuinsh/atuin:main",
                args: ["server", "start"],
                env: [
                  {
                    name: "ATUIN_DB_URI",
                    value: `postgresql:///${pgDatabase}?host=${pgSockDir}`,
                  },
                  { name: "ATUIN_HOST", value: "0.0.0.0" },
                  { name: "ATUIN_PORT", value: `${atuinPort}` },
                  { name: "ATUIN_OPEN_REGISTRATION", value: "true" },
                ],
                ports: [{ containerPort: atuinPort }],
                volumeMounts: [sockMount],
              },
              {
                name: "postgres",
                image: "postgres:latest",
                args: [
                  "-clisten_addresses=",
                  `-cunix_socket_directories=${pgSockDir}`,
                ],
                env: [
                  { name: "POSTGRES_DB", value: pgDatabase },
                  { name: "POSTGRES_USER", value: "atuin" },
                  { name: "POSTGRES_HOST_AUTH_METHOD", value: "trust" },
                ],
                volumeMounts: [
                  sockMount,
                  { name: "database", mountPath: "/var/lib/postgresql/data" },
                ],
              },
            ],
            volumes: [
              { name: "pgsocket", emptyDir: {} },
              {
                name: "database",
                hostPath: { path: "/zssd/general/atuin-pg", type: "Directory" },
              },
            ],
          },
        },
      },
    };

    const svcArgs: k8s.core.v1.ServiceArgs = {
      metadata: { namespace, name, labels },
      spec: {
        ports: [{ name: "http", port: atuinPort }],
        selector: labels,
      },
    };

    const tbArgs: cf.networking.v1alpha1.TunnelBindingArgs = {
      metadata: { namespace, name, labels },
      subjects: [{ name }],
      tunnelRef: { kind: "ClusterTunnel", name: "xnauts-net-tunnel" },
    };

    new k8s.apps.v1.Deployment(name, deployArgs, opts);
    new k8s.core.v1.Service(name, svcArgs, opts);
    new cf.networking.v1alpha1.TunnelBinding(name, tbArgs, opts);
  }
}
