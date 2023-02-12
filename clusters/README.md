# clusters

[Kubernetes][1] cluster manifests managed by [Flux][2].

Structure:

```
.
└── <cluster>/
   └── <namespace>/
      ├── <component>.yaml
      ├── <component>/
      ├── ks.yaml             <-- `kubectl apply` to onboard dir to Flux
      └── kustomization.yaml  <-- List of components to deploy
```

[1]: https://kubernetes.io/
[2]: https://fluxcd.io/
