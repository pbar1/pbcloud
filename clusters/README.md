# clusters

[Kubernetes][1] cluster manifests managed by [Flux][2].

Structure:

```
.
└── <cluster>/
   └── <namespace>/
      ├── <component>.yaml
      ├── <component>/
      └── kustomization.yaml
```

[1]: https://kubernetes.io/
[2]: https://fluxcd.io/
