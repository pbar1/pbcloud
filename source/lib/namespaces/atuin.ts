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

    // Ship the Atuin server and Postgres together as sidecars in a single pod.
    // Since we don't really care about scaling the server, we can do this and
    // not have to worry about managing secrets or exposing the database on the
    // network; instead it's exposed via a Unix domain socket with blind trust
    // auth
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
                  // Connect to Postgres over Unix domain socket
                  {
                    name: "ATUIN_DB_URI",
                    value: `postgresql:///${pgDatabase}?host=${pgSockDir}`,
                  },
                  // Unfortunately it seems Atuin requires both host and port
                  // to be specified explicitly
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
                  // Disable listen address so Postgres is only exposed over
                  // Unix domain socket
                  "-clisten_addresses=",
                  // Override socket directory to the emptyDir mount so it can
                  // be shared with the Atuin container
                  `-cunix_socket_directories=${pgSockDir}`,
                ],
                env: [
                  { name: "POSTGRES_DB", value: pgDatabase },
                  // With Unix domain socket, incoming db user will be the
                  // Unix user
                  { name: "POSTGRES_USER", value: "atuin" },
                  // Equivalent to no auth, which is fine since we're basically
                  // using Postgres as SQLite
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

    new k8s.apps.v1.Deployment(name, deployArgs, opts);
    new k8s.core.v1.Service(name, svcArgs, opts);
  }
}
