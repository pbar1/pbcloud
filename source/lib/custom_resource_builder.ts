import merge from "ts-deepmerge";
import { PartialDeep } from "type-fest";
import * as k8s from "@pulumi/kubernetes";
import { CustomResource } from "@pulumi/pulumi";

export type Constructible<
  Params extends readonly any[] = any[],
  T = any
> = new (...params: Params) => T;

// https://stackoverflow.com/questions/71213636/create-instance-of-generic-class-parameter
class Creator {
  static create<T extends Constructible>(
    constructible: T,
    ...params: ConstructorParameters<T>
  ): InstanceType<T> {
    return new constructible(...params);
  }
}

// https://stackoverflow.com/questions/69687087/transform-named-tuple-to-object
type TupleToObject<
  T extends readonly any[],
  M extends Record<Exclude<keyof T, keyof any[]>, PropertyKey>
> = { [K in Exclude<keyof T, keyof any[]> as M[K]]: T[K] };

type PodCtor = ConstructorParameters<typeof k8s.core.v1.Pod>;
type PodCtorArgs = TupleToObject<PodCtor, ["name", "args", "opts"]>;

class PodBuilder {
  private args: PartialDeep<
    TupleToObject<
      ConstructorParameters<typeof k8s.core.v1.Pod>,
      ["name", "args", "opts"]
    >
  >;
}

export class CustomResourceBuilder<T extends Constructible> {
  private type: T;
  private params: ConstructorParameters<T>;

  constructor(type: T, ...params: ConstructorParameters<T>) {
    this.type = type;
    this.params = { ...params };
    if (this.params[1] === undefined) {
      this.params[1] = {};
    }
    if (this.params[2] === undefined) {
      this.params[2] = {};
    }
  }

  withName(name: ConstructorParameters<T>[0]) {
    this.params[0] = name;
    return this;
  }

  withArgs(args: PartialDeep<ConstructorParameters<T>[1]>) {
    this.params[1] = merge(this.params[1], args);
    return this;
  }

  withOpts(opts: PartialDeep<ConstructorParameters<T>[2]>) {
    this.params[2] = merge(this.params[2], opts);
    return this;
  }

  clone(): CustomResourceBuilder<T> {
    let cloned = new CustomResourceBuilder(
      this.type,
      ...(this.params[0] as ConstructorParameters<T>)
    );

    cloned.params[1] = merge(cloned.params[1], this.params[1]);
    cloned.params[2] = merge(cloned.params[2], this.params[2]);

    return cloned;
  }

  build(): InstanceType<T> {
    return new this.type(this.params[0], this.params[1], this.params[2]);
  }
}
