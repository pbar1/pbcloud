import * as k8s from "@pbcloud/crd/k8s.ts";
import * as cdk8s from "cdk8s";
import * as kplus from "cdk8s-plus-30";
import * as path from "node:path";
import * as url from "node:url";
import { Construct } from "constructs";

// General --------------------------------------------------------------------

/**
 * Capitalizes the first character of the given string.
 * @param s String to capitalize.
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Given an image like "ghcr.io/example/img:latest", return "img".
 * @param image Container image.
 */
export function nameFromImage(image: string): string {
  const name = path.basename(image).split(":")[0];
  if (!name) {
    throw new Error("uanble to get name from image");
  }
  return name;
}

// CDK8s ----------------------------------------------------------------------

export class K8sApp extends cdk8s.App {
  constructor(props?: cdk8s.AppProps) {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    super({
      ...props,
      yamlOutputType: cdk8s.YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
      outdir: `${__dirname}/../../out/k8s`,
    });
  }
}

export class NamespaceChart extends cdk8s.Chart {
  name: string;

  constructor(scope: Construct, name: string) {
    super(scope, name, {
      disableResourceNameHashes: true,
      namespace: name,
    });
    this.name = name;
    new k8s.Namespace(this, name);
  }
}

// K8s ------------------------------------------------------------------------

export function envValues(values: { [name: string]: string }): {
  [name: string]: kplus.EnvValue;
} {
  const envValues: { [name: string]: kplus.EnvValue } = {};
  for (const name in values) {
    const value = values[name];
    if (!value) {
      throw new Error("value not found in dict");
    }
    envValues[name] = kplus.EnvValue.fromValue(value);
  }
  return envValues;
}

/**
 * Properties for `run`.
 */
export interface RunProps {
  env?: { [name: string]: string };
  hostNetwork?: boolean;
  hostPaths?: { [containerPath: string]: string };
  mountConfig?: boolean;
  mountTmp?: boolean;
  port?: number;
  replicas?: number;
  resources?: kplus.ContainerResources;
  securityContextContainer?: kplus.ContainerSecurityContextProps;
  securityContextPod?: kplus.PodSecurityContextProps;
}

/**
 * Run a container image similar to `kubectl run`.
 */
export function run(
  scope: Construct,
  image: string,
  props?: RunProps,
): kplus.Deployment {
  const name = nameFromImage(image);

  const env = props?.env;
  const hostNetwork = props?.hostNetwork ?? false;
  const hostPaths = props?.hostPaths;
  const mountConfig = props?.mountConfig ?? true;
  const mountTmp = props?.mountTmp ?? true;
  const portNumber = props?.port;
  const replicas = props?.replicas ?? 1;
  const resources = props?.resources ?? {};
  const securityContextContainer = props?.securityContextContainer ?? {
    ensureNonRoot: false,
  };
  const securityContextPod = props?.securityContextPod ?? {
    ensureNonRoot: false,
  };

  // TODO: Merge with env from other mounts
  const envVariables = env ? envValues(env) : undefined;

  const deployment = new kplus.Deployment(scope, name, {
    metadata: { name },
    replicas,
    securityContext: securityContextPod,
    hostNetwork,
  });

  const container = deployment.addContainer({
    name,
    image,
    portNumber,
    envVariables,
    resources,
    securityContext: securityContextContainer,
  });

  for (const ctrPath in hostPaths) {
    const hostPath = hostPaths[ctrPath];
    if (!hostPath) {
      continue;
    }
    const volName = path.basename(ctrPath);
    container.mount(
      ctrPath,
      kplus.Volume.fromHostPath(scope, `${name}-${volName}`, volName, {
        path: hostPath,
      }),
    );
  }

  if (mountTmp) {
    container.mount(
      "/tmp",
      kplus.Volume.fromEmptyDir(scope, `${name}-tmp`, "tmp"),
    );
  }

  if (mountConfig) {
    container.mount(
      "/config",
      kplus.Volume.fromHostPath(scope, `${name}-config`, "config", {
        path: `/zssd/general/config/${name}`,
      }),
    );
  }

  if (portNumber) {
    deployment.exposeViaService({ name });
  }

  return deployment;
}
