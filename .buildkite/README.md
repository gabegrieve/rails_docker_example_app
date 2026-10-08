# Agent targeting experiment

This pipeline replaces the previous feature/dependency showcase. The previous
version remains available in git history.

## Setup

Create or choose two queues in the same cluster as this pipeline, then start
three local agents. Keep the agent token in the environment; do not commit it.

```sh
buildkite-agent start --token "$BUILDKITE_AGENT_TOKEN" \
  --name "tag-lab-rich" --queue "tag-mismatch-lab" \
  --tags "capability=alpha,flavor=rich"

buildkite-agent start --token "$BUILDKITE_AGENT_TOKEN" \
  --name "tag-lab-plain" --queue "tag-mismatch-lab" \
  --tags "capability=alpha,flavor=plain"

buildkite-agent start --token "$BUILDKITE_AGENT_TOKEN" \
  --name "tag-lab-other-queue" --queue "tag-mismatch-lab-other" \
  --tags "capability=alpha,flavor=rich"
```

Run the pipeline, wait until `Hold the rich agent` is running on
`tag-lab-rich`, and release the `Release targeting probes` block. Observe the
job states and the agent names printed in each log. The intentional no-match
job should remain waiting; cancel it after observing it.

The experiment checks that queue and additional agent tags are conjunctive,
that an agent matching only one criterion is not eligible, and that an extra
unrequested tag does not outrank an available agent matching all requested
criteria.
