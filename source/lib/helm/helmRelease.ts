import { HelmRelease, HelmReleaseArgs } from "../../crds/gen/helm/v2beta1";
import { CustomResourceOptions } from "@pulumi/pulumi";

export class HelmReleaseBuilder {
  private opts?: CustomResourceOptions;
  private chartRepo?: string;
  private chart?: string;
  private namespace?: string;
  private name?: string;
  private interval: string = "24h";
  private sourceRefNamespace: string = "flux-system";
  private sourceRefKind: string = "HelmRepository";
  private values: any = {};

  withOpts(opts: CustomResourceOptions) {
    this.opts = opts;
    return this;
  }

  withChartRepo(chartRepo: string) {
    this.chartRepo = chartRepo;
    return this;
  }

  withChart(chart: string) {
    this.chart = chart;
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

  withInterval(interval: string) {
    this.interval = interval;
    return this;
  }

  withSourceRefNamespace(sourceRefNamespace: string) {
    this.sourceRefNamespace = sourceRefNamespace;
    return this;
  }

  withValues(values: any) {
    this.values = values;
    return this;
  }

  clone(): HelmReleaseBuilder {
    let copy = new HelmReleaseBuilder();

    copy.opts = this.opts;
    copy.chartRepo = this.chartRepo;
    copy.chart = this.chart;
    copy.namespace = this.namespace;
    copy.name = this.name;
    copy.interval = this.interval;
    copy.sourceRefNamespace = this.sourceRefNamespace;
    copy.sourceRefKind = this.sourceRefKind;
    copy.values = this.values;

    return copy;
  }

  build(): HelmRelease {
    if (this.chartRepo === undefined) {
      throw new Error("chartRepo must be set");
    }
    if (this.chart === undefined) {
      throw new Error("chart must be set");
    }

    const name = this.name ?? this.chart;

    const args: HelmReleaseArgs = {
      metadata: {
        name: name,
        namespace: this.namespace,
      },
      spec: {
        interval: this.interval,
        chart: {
          spec: {
            chart: this.chart,
            sourceRef: {
              name: this.chartRepo,
              namespace: this.sourceRefNamespace,
              kind: this.sourceRefKind,
            },
          },
        },
        values: this.values,
      },
    };

    return new HelmRelease(name, args, this.opts);
  }
}
