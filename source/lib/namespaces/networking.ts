import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "networking") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    // It looks like the kube secret has to exist before its able to be used by
    // Tailscale. Just make an empty one out of band...
    const tsRouterName = "tailscale-subnet-router";
    const tsKubeSecret = "tailscale-auth";
    const tsRouterSaArgs: k8s.core.v1.ServiceAccountArgs = {
      metadata: { namespace, name: tsRouterName },
    };
    const tsRouterRoleArgs: k8s.rbac.v1.RoleArgs = {
      metadata: { namespace, name: tsRouterName },
      rules: [
        // Create can not be restricted to a resource name
        { apiGroups: [""], resources: ["secrets"], verbs: ["create"] },
        {
          apiGroups: [""],
          resources: ["secrets"],
          resourceNames: [tsKubeSecret],
          verbs: ["get", "update", "patch"],
        },
      ],
    };
    const tsRouterRoleBindingArgs: k8s.rbac.v1.RoleBindingArgs = {
      metadata: { namespace, name: tsRouterName },
      subjects: [{ kind: "ServiceAccount", name: tsRouterName }],
      roleRef: {
        kind: "Role",
        name: tsRouterName,
        apiGroup: "rbac.authorization.k8s.io",
      },
    };
    const tsRouterDeployArgs: k8s.apps.v1.DeploymentArgs = {
      metadata: {
        namespace,
        name: tsRouterName,
        labels: {
          app: tsRouterName,
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: tsRouterName,
          },
        },
        template: {
          metadata: { labels: { app: tsRouterName } },
          spec: {
            serviceAccountName: tsRouterName,
            automountServiceAccountToken: true,
            containers: [
              {
                name: "tailscale",
                image: "ghcr.io/tailscale/tailscale:latest",
                imagePullPolicy: "Always",
                env: [
                  { name: "TS_HOSTNAME", value: "tec" },
                  { name: "TS_KUBE_SECRET", value: tsKubeSecret },
                  { name: "TS_ROUTES", value: "192.168.0.0/23" },
                  { name: "TS_USERSPACE", value: "true" },
                ],
              },
            ],
          },
        },
      },
    };
    new k8s.core.v1.ServiceAccount(tsRouterName, tsRouterSaArgs, opts);
    new k8s.rbac.v1.Role(tsRouterName, tsRouterRoleArgs, opts);
    new k8s.rbac.v1.RoleBinding(tsRouterName, tsRouterRoleBindingArgs, opts);
    new k8s.apps.v1.Deployment(tsRouterName, tsRouterDeployArgs, opts);
  }
}
