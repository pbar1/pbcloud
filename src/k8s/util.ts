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
