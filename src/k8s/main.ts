import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import { K8sApp, NamespaceChart } from "./util.ts";

const app = new K8sApp();

// For each file in the `namespace` dir, import that file and run its
// top-level function `create`
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nsDir = path.join(__dirname, "namespace");
const nsFiles = await fs.readdir(nsDir);
for (const nsFile of nsFiles) {
  if (!nsFile.endsWith(".ts")) {
    continue;
  }
  const nsName = path.basename(nsFile, path.extname(nsFile));
  const nsPath = path.join(nsDir, nsFile);
  const ns = await import(nsPath);
  const nsChart = new NamespaceChart(app, nsName);
  ns.create(nsChart);
}

app.synth();
