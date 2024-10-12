import { K8sApp, NamespaceChart } from "./util";

const app = new K8sApp();

new NamespaceChart(app, "onepassword");

app.synth();
