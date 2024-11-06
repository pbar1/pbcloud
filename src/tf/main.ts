import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import { TFApp, WorkspaceStack } from "./util.ts";

const app = new TFApp();

// For each file in the `workspace` dir, import that file and run its
// top-level function `create`
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wsDir = path.join(__dirname, "workspace");
const wsFiles = await fs.readdir(wsDir);
for (const wsFile of wsFiles) {
  if (!wsFile.endsWith(".ts")) {
    continue;
  }
  const wsName = path.basename(wsFile, path.extname(wsFile));
  const wsPath = path.join(wsDir, wsFile);
  const ws = await import(wsPath);
  const wsStack = new WorkspaceStack(app, wsName);
  ws.create(wsStack);
}

app.synth();
