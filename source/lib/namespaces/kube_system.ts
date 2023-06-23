import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "kube-system") {
    super(namespace, false);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const amdGpuName = "amd-gpu";
    const amdGpuArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: amdGpuName },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: amdGpuName,
            sourceRef: {
              kind: "HelmRepository",
              name: amdGpuName,
              namespace: "flux-system",
            },
          },
        },
        values: {
          labeller: { enabled: true },
          // https://github.com/RadeonOpenCompute/k8s-device-plugin/issues/31#issuecomment-1361061842
          dp: { image: { tag: "1.18.0" } },
        },
        // postRenderers: [
        //   {
        //     kustomize: {
        //       patchesJson6902: [
        //         {
        //           target: {
        //             group: "rbac.authorization.k8s.io",
        //             version: "v1beta1",
        //             name: ".*",
        //           },
        //           patch: [
        //             {
        //               op: "replace",
        //               path: "/apiVersion",
        //               // FIXME: Pulumi does not like this value which isn't a JSON object
        //               value: "rbac.authorization.k8s.io/v1",
        //             },
        //           ],
        //         },
        //       ],
        //     },
        //   },
        // ],
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(amdGpuName, amdGpuArgs, opts);

    const oidcAdminRoleArgs: k8s.rbac.v1.ClusterRoleBindingArgs = {
      metadata: { name: "oidc-admin" },
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "cluster-admin",
      },
      subjects: [
        {
          apiGroup: "rbac.authorization.k8s.io",
          kind: "User",
          name: "${EMAIL}",
        },
      ],
    };
    new k8s.rbac.v1.ClusterRoleBinding("oidc-admin", oidcAdminRoleArgs, opts);
  }
}
