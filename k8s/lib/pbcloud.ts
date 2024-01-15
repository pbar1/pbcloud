import * as k8s from "@pbcloud/third-party-crds/k8s";
import * as cdk8s from "cdk8s";
import { Construct } from "constructs";
import * as path from "path";

// CDK8s abstractions ---------------------------------------------------------

export interface NamespaceProps {
  /**
   * Whether to create the Kubernetes namespace
   * @default true
   */
  createNamespace?: boolean;
}

/**
 * Wrapper around `cdk8s.Chart` that automatically creates a Kubernetes
 * namespace unless disabled. This is meant to be extended by specific
 * namespaces to encapsulate their resources.
 */
export class Namespace extends cdk8s.Chart {
  constructor(scope: Construct, name: string, props?: NamespaceProps) {
    super(scope, name);

    const createNamespace = props?.createNamespace ?? true;

    if (createNamespace) {
      new k8s.Namespace(this, name, {
        metadata: { name },
      });
    }
  }
}

/**
 * Wrapper around `cdk8s.App` that renders manifests into the `out/${name}`
 * directory with one Kubernetes resource per file.
 */
export class App extends cdk8s.App {
  constructor(name: string) {
    super({
      outdir: `out/${name}`,
      yamlOutputType: cdk8s.YamlOutputType.FILE_PER_RESOURCE,
    });
  }
}

// Helper functions -----------------------------------------------------------

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
  return path.basename(image).split(":")[0];
}

/**
 * Convenience function for creating a Kubernetes container environment
 * variable from a name-value pair.
 * @param name Environment variable name.
 * @param value Environment variable value.
 */
export function env(name: string, value: string): k8s.EnvVar {
  return { name, value };
}

/**
 * Convenience function for creating a Kubernetes container environment
 * variable from a Kubernetes secret key.
 * @param name Environment variable name.
 * @param secret Kubernetes secret name.
 * @param key Kubernetes secret key containing environment variable value.
 */
export function envSec(name: string, secret: string, key: string): k8s.EnvVar {
  return {
    name,
    valueFrom: { secretKeyRef: { name: secret, key } },
  };
}

/**
 * Convenience function for creating a Kubernetes container port from the given
 * values.
 * @param port Port number.
 * @param protocol Port protocol.
 * @param name Port name.
 * @returns
 */
export function port(
  port: number,
  protocol?: string,
  name?: string,
): k8s.ContainerPort {
  return {
    containerPort: port,
    protocol,
    name,
  };
}

/**
 * Convenience function for creating a Kubernetes volume and volume mount of
 * type `hostPath`.
 * @param name Volume name.
 * @param hostPath Path on the host.
 * @param mountPath Path within the container.
 * @param readOnly Whether to mount the path as read-only.
 * @returns A tuple containing the volume and volume mount.
 */
export function hostPath(
  name: string,
  hostPath: string,
  mountPath: string,
  readOnly?: boolean,
): [k8s.Volume, k8s.VolumeMount] {
  return [
    { name, hostPath: { path: hostPath } },
    { name, mountPath, readOnly },
  ];
}

/**
 * Convenience function for creating a Kubernetes volume and volume mount of
 * type `emptyDir`.
 * @param name Volume name.
 * @param mountPath Path within the container.
 * @param memory Whether the volume should be memory-backed (ie, a ramdisk).
 * @returns A tuple containing the volume and volume mount.
 */
export function emptyDir(
  name: string,
  mountPath: string,
  memory = false,
): [k8s.Volume, k8s.VolumeMount] {
  const medium = memory ? "Memory" : "";
  return [
    { name, emptyDir: { medium } },
    { name, mountPath },
  ];
}

/**
 * Creates pod annotations to sync a 1Password secret to a Kubernetes secret
 * using the [1Password operator](https://developer.1password.com/docs/k8s/k8s-operator/).
 * @param itemName Kubernetes secret name
 * @param itemPath 1Password secret path
 * @returns Pod annotations object
 */
export function opSecret(
  name: string,
  path?: string,
): { [name: string]: string } {
  const itemPath = path ?? `vaults/pbcloud/items/${name}`;
  return {
    "operator.1password.io/item-name": name,
    "operator.1password.io/item-path": itemPath,
  };
}
