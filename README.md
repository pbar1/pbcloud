# `pbcloud`

Personal cloud and homelab config.

Sources are written in Typescript with CDK8s and CDKTF and rendered to
Kubernetes YAML and Terraform JSON respectively.

## Structure

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
│       └── stack/
├── out/
│   ├── k8s/
│   │   └── example/
│   │       └── Deployment.foo.k8s.yaml
│   └── tf/
└── vendor/
    ├── crd/
    └── helm/
```
