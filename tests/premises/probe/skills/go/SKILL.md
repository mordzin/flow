---
name: go
description: Flow premise probe. Spawns the probe subagent.
disable-model-invocation: true
---
The user running this skill is the explicit request to spawn a subagent.
Call the Agent tool exactly once with subagent_type "probe:probe", model "haiku", effort "low", prompt "Run the probe.". Then print the agent's reply verbatim.
