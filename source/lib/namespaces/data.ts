import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as op from "../crds/onepassword";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "data") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const mintCronName = "mint-puller";
    const mintCronArgs: k8s.batch.v1.CronJobArgs = {
      metadata: { namespace, name: mintCronName },
      spec: {
        schedule: "30 14 * * *", // every day at 2:30 PM
        jobTemplate: {
          spec: {
            template: {
              spec: {
                restartPolicy: "Never",
                containers: [
                  {
                    name: "mintapi",
                    image: "ghcr.io/mintapi/mintapi:latest",
                    command: [
                      "sh",
                      "-c",
                      "mintapi $MINT_USERNAME $MINT_PASSWORD --mfa-method=soft-token --mfa-token=$MINT_MFA_TOKEN --headless --use-chromedriver-on-path --limit=10000 --format=json --transactions | gzip > /data/transactions.$(date +%s).json.gz",
                    ],
                    envFrom: [{ secretRef: { name: "mintapi" } }],
                    volumeMounts: [{ name: "data", mountPath: "/data" }],
                  },
                ],
                volumes: [
                  { name: "data", hostPath: { path: "/data/general/mint" } },
                ],
                securityContext: {
                  fsGroup: 100,
                },
              },
            },
          },
        },
      },
    };
    new k8s.batch.v1.CronJob(mintCronName, mintCronArgs, opts);

    const mintOpArgs: op.onepassword.v1.OnePasswordItemArgs = {
      metadata: { namespace, name: "mintapi" },
      spec: {
        itemPath: "vaults/pbcloud/items/mintapi",
      },
    };
    new op.onepassword.v1.OnePasswordItem("mintapi", mintOpArgs, opts);
  }
}
