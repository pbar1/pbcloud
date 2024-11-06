import * as cdktf from "cdktf";
import * as path from "node:path";
import * as url from "node:url";
import { Construct } from "constructs";

// CDKTF ----------------------------------------------------------------------

export class TFApp extends cdktf.App {
  constructor(config?: cdktf.AppConfig) {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    super({
      ...config,
      outdir: `${__dirname}/../../out/tf`,
    });
  }
}

export class WorkspaceStack extends cdktf.TerraformStack {
  name: string;

  constructor(scope: Construct, name: string) {
    super(scope, name);
    this.name = name;
    // TODO: add GcsBackend
  }
}
