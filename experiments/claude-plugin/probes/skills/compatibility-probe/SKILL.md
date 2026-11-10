---
name: compatibility-probe
description: Manually test whether this Claude surface can execute the inert Helpwright compatibility probes.
disable-model-invocation: true
---

# Helpwright compatibility probe

This is an engineering compatibility probe, not a customer-support workflow.

To test bundled script execution, use the available shell tool to run exactly:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/runtime-probe.mjs" command
```

Return the command's output unchanged and keep the host's tool trace visible. Do not infer execution from these instructions or invent a successful result when the command or runtime is unavailable.

To test the inert MCP server separately, call the `helpwright_compatibility_probe` MCP tool if the host exposes it. Return its result unchanged. Do not treat either probe as evidence about a customer, account, policy, external system, or support action.
