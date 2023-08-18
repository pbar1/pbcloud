import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as projectcontour from "./crds/projectcontour";

function kvToEnv(entries: {
  [key: string]: string;
}): k8s.types.input.core.v1.EnvVar[] {
  return Object.keys(entries).map((key) => ({
    name: key,
    value: entries[key],
  }));
}

function ctrToSvcPort(
  ports?: k8s.types.input.core.v1.ContainerPort[]
): k8s.types.input.core.v1.ServicePort[] | undefined {
  if (ports === undefined) {
    return undefined;
  }
  return Object.values(ports).map((port) => ({
    name: port.name,
    port: port.containerPort,
    targetPort: port.containerPort,
    protocol: port.protocol,
  }));
}

// RunContainer is a builder for running a simple container as a Kubernetes
// deployment and service, along with other additional features.
export class RunContainer {
  private opts: pulumi.ComponentResourceOptions;
  private name: string;
  private namespace: string;
  private image: string;
  private selectorLabels: { [key: string]: string };

  private imagePullPolicy: string = "Always";
  private env?: k8s.types.input.core.v1.EnvVar[];
  private ports?: k8s.types.input.core.v1.ContainerPort[];
  private httpPort?: number;
  private fqdn?: string;
  private serviceType: string = "ClusterIP";
  private tlsSecretName?: string;

  constructor(
    name: string,
    namespace: string,
    image: string,
    opts: pulumi.CustomResourceOptions
  ) {
    this.name = name;
    this.namespace = namespace;
    this.image = image;
    this.opts = opts;

    this.selectorLabels = { app: name };
  }

  withImagePullPolicy(imagePullPolicy: string) {
    this.imagePullPolicy = imagePullPolicy;
    return this;
  }

  withEnvMap(envMap: { [key: string]: string }) {
    if (this.env === undefined) {
      this.env = [];
    }
    this.env = this.env.concat(kvToEnv(envMap));
    return this;
  }

  withEnv(envVar: k8s.types.input.core.v1.EnvVar) {
    if (this.env === undefined) {
      this.env = [];
    }
    this.env.push(envVar);
    return this;
  }

  // Convenience function for designating a specific port number to expose as
  // HTTP. Will be used as the target for ingress if FQDN is set.
  withHttpPort(httpPort: number) {
    if (this.ports === undefined) {
      this.ports = [];
    }
    const port: k8s.types.input.core.v1.ContainerPort = {
      name: "http",
      containerPort: httpPort,
      protocol: "TCP",
    };
    this.ports.push(port);
    this.httpPort = httpPort;
    return this;
  }

  withPort(port: k8s.types.input.core.v1.ContainerPort) {
    if (this.ports === undefined) {
      this.ports = [];
    }
    this.ports.push(port);
    return this;
  }

  withFQDN(fqdn: string) {
    this.fqdn = fqdn;
    return this;
  }

  clone(): RunContainer {
    return Object.assign({}, this);
  }

  buildDeploy(): k8s.apps.v1.Deployment {
    const args: k8s.apps.v1.DeploymentArgs = {
      metadata: {
        name: this.name,
        namespace: this.namespace,
      },
      spec: {
        selector: { matchLabels: this.selectorLabels },
        template: {
          metadata: { labels: this.selectorLabels },
          spec: {
            containers: [
              {
                name: this.name,
                image: this.image,
                imagePullPolicy: this.imagePullPolicy,
                env: this.env,
                ports: this.ports,
              },
            ],
          },
        },
      },
    };

    return new k8s.apps.v1.Deployment(this.name, args, this.opts);
  }

  buildService(): k8s.core.v1.Service {
    const args: k8s.core.v1.ServiceArgs = {
      metadata: {
        name: this.name,
        namespace: this.namespace,
      },
      spec: {
        selector: this.selectorLabels,
        type: this.serviceType,
        ports: ctrToSvcPort(this.ports),
      },
    };

    return new k8s.core.v1.Service(this.name, args, this.opts);
  }

  buildProxy(): projectcontour.projectcontour.v1.HTTPProxy {
    if (this.fqdn === undefined) {
      throw new Error("fqdn must be set");
    }
    if (this.httpPort === undefined) {
      throw new Error("httpPort must be set");
    }

    const args: projectcontour.projectcontour.v1.HTTPProxyArgs = {
      metadata: {
        name: this.name,
        namespace: this.namespace,
      },
      spec: {
        virtualhost: {
          fqdn: this.fqdn,
          tls: this.tlsSecretName
            ? { secretName: this.tlsSecretName }
            : undefined,
        },
        routes: [{ services: [{ name: this.name, port: this.httpPort }] }],
      },
    };

    return new projectcontour.projectcontour.v1.HTTPProxy(
      this.name,
      args,
      this.opts
    );
  }

  build() {
    this.buildDeploy();

    if (this.ports) {
      this.buildService();
    }

    if (this.fqdn && this.httpPort) {
      this.buildProxy();
    }
  }
}
