import { $ } from "execa";
import * as fs from "fs";

interface Chart {
  url: string;
  chart: string;
}

// prettier-ignore
const charts: Chart[] = [
  { url: "https://1password.github.io/connect-helm-charts", chart: "connect" },
  { url: "https://prometheus-community.github.io/helm-charts", chart: "kube-prometheus-stack" },
  { url: "https://grafana.github.io/helm-charts", chart: "loki-stack" },
];

function clearAndUpper(text: string) {
  return text.replace(/-/, "").toUpperCase();
}

function toPascalCase(text: string) {
  return text.replace(/(^\w|-\w)/g, clearAndUpper);
}

// TODO: Rename incoming chart, don't blindly download every time
const helmPull = async (chart: Chart) => {
  await $`rm -rf ${__dirname}/${chart.chart}`;
  await $`helm repo add pbcloud-temp ${chart.url}`;
  await $`helm pull pbcloud-temp/${chart.chart} --untar --destination=${__dirname}`;
  await $`helm repo remove pbcloud-temp`;

  const chartIdentifier = toPascalCase(chart.chart);
  const indexTs = `import * as cdk8s from "cdk8s";
import { Construct } from "constructs";

interface ${chartIdentifier}Props {
  releaseName?: string;
  namespace?: string;
  values?: {
    [key: string]: unknown;
  };
}

export class ${chartIdentifier} extends cdk8s.Chart {
  constructor(scope: Construct, id: string, props?: ${chartIdentifier}Props) {
    super(scope, id);

    new cdk8s.Helm(this, "helm", {
      chart: __dirname,
      releaseName: props?.releaseName,
      namespace: props?.namespace,
      values: props?.values,
    });
  }
}
`;
  fs.writeFileSync(`${__dirname}/${chart.chart}/index.ts`, indexTs);
};

for (const chart of charts) {
  await helmPull(chart);
}
