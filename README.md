# `pbcloud`

Personal cloud and homelab config.

Sources are written in Typescript with CDK8s and CDKTF and rendered to
Kubernetes YAML and Terraform JSON respectively.

## Structure

Each Typescript file in `namespace`/`workspace` (K8s/TF respectively) is
expected to export a top level function `create` that instantiates Constructs.
These files will by dynamically resolved and built, with an output directory
generated for each.

```
.
├── src/
│   ├── k8s/
│   │   ├── main.ts
│   │   └── namespace/
│   │       ├── example.ts
│   │       └── ...
│   └── tf/
│       ├── main.ts
│       └── workspace/
│           ├── example.ts
│           └── ...
├── out/
│   ├── k8s/
│   │   └── example/
│   │       └── Deployment.foo.k8s.yaml
│   └── tf/
│       └── stacks/example/
│           └── cdk.tf.json
└── vendor/
    ├── crd/
    └── helm/
```
