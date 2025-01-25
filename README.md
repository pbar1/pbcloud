# pbcloud

Personal cloud and homelab config.

## Structure

```
.
├── clusters/
│   └── <cluster name>/
│       ├── main.tf (backend and provider config)
│       ├── <namespace name>.tf (namespace resource config)
│       └── ...
└── modules/
    └── <module name>
```

## FAQ

- Why not **CDK8s/CDKTF**?
  - I've tried every combination of the CDKs with Node/Deno/Bun, and liked them - I much prefer TypeScript to HCL. Unfortunately, the CDK ecosystem seems to be heading toward adandonment. There are also various issues with the runtimes' compatibility with the CDK tools.
- Why not **K8s manifests**?
  - Terraform enforces dependencies with its DAG - this does not happen when applying manifests in bulk from a directory. Using Terraform for all also helps cross-ecosystem resource support (ex, Cloudflare + Kubernetes)
- Why not **Helm**?
  - Much has been said already on the merits of templating YAML. That said, I'll comsume Helm charts via the Terraform provider so as not to reinvent the wheel - I just won't write my own.
- Why not **Jsonnet**/Cue/etc?
  - Also tried Jsonnet/Tanka, and the lack of support was the main issue. It was cool, but has similar issues to CDK (ecosystem), _is_ ultimately just straight manifests (no DAG), and is only for K8s resources (ie, no cloud config).
