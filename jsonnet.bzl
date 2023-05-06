def jsonnet_json_impl(ctx: "context") -> ["provider"]:
    default_outputs = [ctx.actions.declare_output(o) for o in ctx.attrs.outs]
    # FIXME: Hardcodes first array index, doesn't support `jsonnet -m`
    ctx.actions.run(["jsonnet", "-o", default_outputs[0].as_output(), ctx.attrs.src], category = "jsonnet_compile")
    return [
        DefaultInfo(default_outputs = default_outputs)
    ]

jsonnet_json = rule(
    impl = jsonnet_json_impl,
    attrs = {
        "deps": attrs.list(attrs.dep()),
        "src": attrs.source(),
        "outs": attrs.list(attrs.string()),
    }
)
