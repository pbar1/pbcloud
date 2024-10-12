import * as kplus from "cdk8s-plus-30";
import { NamespaceChart } from "../util.ts";

export function create(ns: NamespaceChart) {
  new kplus.Service(ns, "dummy");
}
