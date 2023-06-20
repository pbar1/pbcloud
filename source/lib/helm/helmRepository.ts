import {
  HelmRepository,
  HelmRepositoryArgs,
} from "../../crds/gen/source/v1beta2";
import { CustomResourceOptions } from "@pulumi/pulumi";

export class HelmRepositoryBuilder {
  private opts?: CustomResourceOptions;
  private namespace?: string;
  private name?: string;
  private url?: string;
  private interval: string = "24h";

  withOpts(opts: CustomResourceOptions) {
    this.opts = opts;
    return this;
  }

  withNamespace(namespace: string) {
    this.namespace = namespace;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  withUrl(url: string) {
    this.url = url;
    return this;
  }

  withInterval(interval: string) {
    this.interval = interval;
    return this;
  }

  clone(): HelmRepositoryBuilder {
    let copy = new HelmRepositoryBuilder();

    copy.opts = this.opts;
    copy.namespace = this.namespace;
    copy.name = this.name;
    copy.url = this.url;
    copy.interval = this.interval;

    return copy;
  }

  build(): HelmRepository {
    if (this.name === undefined) {
      throw new Error("name must be set");
    }
    if (this.url === undefined) {
      throw new Error("url must be set");
    }

    const repoType = this.url.includes("oci://") ? "oci" : undefined;

    const args: HelmRepositoryArgs = {
      metadata: {
        name: this.name,
        namespace: this.namespace,
      },
      spec: {
        url: this.url,
        type: repoType,
        interval: this.interval,
      },
    };

    return new HelmRepository(this.name, args, this.opts);
  }
}
