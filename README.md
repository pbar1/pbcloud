# pbcloud :izakaya_lantern:

Personal cloud configuration. Uses CDK8s to render manifests to Kubernetes YAML. Both source and materialized configs are committed to version control.

### Common Tasks

Create a new namespace:

```
task new:namespace -- foo
```

### Directory Structure

```
.
├── k8s/
│   ├── index.ts
│   └── namespaces/
│       ├── media.ts
│       └── ...
└── out/
    ├── media/
    │   ├── Deployment.sonarr.k8s.yaml
    │   └── ...
    └── ...
```

### TODOs

- FIXME: Kill references to `TUNNEL_TOKEN` in pbcloud
- TODO: Move `VENDOR.ts` into `scripts/`
