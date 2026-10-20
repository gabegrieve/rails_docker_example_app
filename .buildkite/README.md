# Waiting-job lab

This pipeline creates real scheduling conditions for the proposed "Explain why
a job is waiting" job panel. It does not implement that panel, fabricate job
states, run Rails, or need Docker. Labels describe the intended fixture, not a
diagnosis: verify the actual job state and current agents before drawing a
conclusion. Existing self-hosted UI will still say "Waiting for agent" for
several different conditions.

## Isolated sandbox setup

Use only [gabe-sandbox](https://buildkite.com/gabe-sandbox). Create a dedicated
cluster and these **self-hosted** queues; do not repurpose shared queues:

| Queue | Connected agents | Tags |
| --- | --- | --- |
| `wait-lab-control` | Two | Both `capability=alpha,flavor=rich` |
| `wait-lab-empty` | None | Do not attach an autoscaler |
| `wait-lab-mismatch` | Two | One `capability=alpha,flavor=plain`; one `capability=beta,flavor=rich` |
| `wait-lab-busy` | One | `capability=alpha,flavor=rich` |
| `wait-lab-paused` | One | `capability=alpha,flavor=rich` |

Set **this dedicated cluster's** default queue to `wait-lab-control`. Associate
the lab pipeline with this cluster and allow only one lab build at a time.
Pipeline-level default agent rules should be empty. Confirm the organization
has sufficient job capacity before the core run; unrelated platform or billing
limits can mask the intended observations.

Supply the cluster token privately in `BUILDKITE_AGENT_TOKEN` in each terminal.
The agent reads it from the environment; do not put tokens in YAML or Git.
Start these five commands in separate terminals (the first spawns two agents):

```sh
buildkite-agent start --name 'wait-lab-control-%spawn' --spawn 2 \
  --queue wait-lab-control --tags 'capability=alpha,flavor=rich'

buildkite-agent start --name wait-lab-mismatch-alpha \
  --queue wait-lab-mismatch --tags 'capability=alpha,flavor=plain'

buildkite-agent start --name wait-lab-mismatch-rich \
  --queue wait-lab-mismatch --tags 'capability=beta,flavor=rich'

buildkite-agent start --name wait-lab-busy \
  --queue wait-lab-busy --tags 'capability=alpha,flavor=rich'

buildkite-agent start --name wait-lab-paused \
  --queue wait-lab-paused --tags 'capability=alpha,flavor=rich'
```

The control agents are also a wrong-queue negative control: they match both
tags requested by the mismatch job but must never receive it. No lab agent
should have the `wait_lab_absent` tag.

Create a pipeline named **Waiting job lab** with repository
`https://github.com/gabegrieve/rails_docker_example_app.git`. The agents need
read access to that repository. After publishing the simulation branch, set
the pipeline's default branch to `waiting-job-simulation` and use that branch
for new builds. Configure the pipeline's YAML steps as:

```yaml
steps:
  - label: ":pipeline: Upload waiting-job lab"
    agents:
      queue: wait-lab-control
    command: buildkite-agent pipeline upload .buildkite/pipeline.yml
```

Keep the existing `.yml` filename; do not add a competing `pipeline.yaml`.

## Core run: self-hosted observations and existing waits

Leave `WAIT_LAB_MODE` unset, or set it to `core` in the new build's environment.
The `pipeline.yml` loader uploads only `pipeline.core.yml`; it does not submit
any hosted-queue references. The five self-hosted queues are sufficient.

Buildkite validates queue names even for jobs inside false-condition groups.
Keeping optional scenarios in separate uploads is necessary; `if` conditions
alone do not make an absent hosted queue safe.

1. Wait for **Load waiting-job scenario** to pass, then expand the core group.
   The three targeting controls should run, including the job with no explicit
   queue and the `capability=*` job.
2. Wait until **both** `SETUP` hold jobs show **Running**, and the pause setup
   job has **passed**. Then release **Release busy and concurrency probes**
   within the holds' ten-minute window. The input is deliberately not dependent
   on the holds finishing.
3. Leave **Release dependency** closed. Inspect the selected jobs below and
   compare each with the relevant queue/agent screen.

| Step key | Expected actual state | Observation to verify |
| --- | --- | --- |
| `no-connected-agents` | `scheduled` | Existing `wait-lab-empty` queue has no connected agents. This is not a nonexistent-queue configuration error. |
| `no-matching-agents` | `scheduled` | Both mismatch agents are connected; each matches one requirement, but neither matches all requirements. Correct tags in another queue do not count. |
| `missing-wildcard-tag` | `scheduled` | `key=*` still requires the key to exist. It does not match agents missing that tag. |
| `matching-agents-busy` | `scheduled` | Its sole matching agent is running `hold-busy-agent`. There is no concurrency group on this probe. |
| `matching-agents-paused` | `scheduled` | Its matching agent is connected and idle but dispatch-paused after the setup job. Pause automatically expires after 15 minutes. |
| `dependency-waiting` | `waiting` | Its input dependency is unreleased; diagnose this before agent capacity. |
| `concurrency-limited` | `limited` | `hold-concurrency-slot` owns the concurrency slot while a second control agent is idle. |

`control-default`, `control-exact`, and `control-wildcard` are positive controls.
The wildcard test uses the dispatcher's existing whole-value `*` semantics,
not a new prefix-glob interpretation. The concurrency group is scoped to the
pipeline and build number so another build cannot own this run's slot.

These are timestamped observations, not permanent causes. Check recovery:

- Let the holds finish (or cancel just the holder jobs): the busy and concurrency
  probes should run without editing their targeting.
- Resume the paused lab agent in the agent UI: its probe should run.
- Release the dependency input: its job should become runnable.
- To recover the empty-queue case, start a dedicated agent on `wait-lab-empty`.
  To recover the conjunctive mismatch, start an agent on `wait-lab-mismatch`
  tagged `capability=alpha,flavor=rich`. It should not run the missing-tag probe
  unless you also supply `wait_lab_absent=present`.

## Optional runs: hosted startup and real limits

Choose **one** `WAIT_LAB_MODE` per build in the Buildkite new-build environment,
not in a shell command after upload. The loader uploads only that scenario's
file, so intentionally scheduled core jobs cannot consume capacity and mask
an optional experiment. Unknown mode values fail the loader with an error.

The scenario files are `pipeline.hosted-images.yml`,
`pipeline.hosted-limit.yml`, and `pipeline.platform-limit.yml`. Make any
parallelism changes in the corresponding file before committing and pushing.

Cancel earlier lab builds before running these experiments. For hosted runs,
create a **Linux hosted** queue named `wait-lab-hosted` in the lab cluster, use
the smallest permitted shape, and verify hosted billing and custom-image access.
Each optional group also requires manual input before requesting capacity.

| `WAIT_LAB_MODE` | Setup and expected observation |
| --- | --- |
| `hosted-images` | Release the hosted-image input and let the healthy `hosted-startup` control finish. Then release **one** image-error input at a time, cancelling that attempt before releasing the other. `hosted-unresolvable-image` requests an intentionally missing image tag. `hosted-missing-tools` uses Alpine without the required Bash and Git. Inspect the actual hosted status response; image resolution and repeated startup failures should be distinguishable where the feature is available. |
| `hosted-limit` | Verify the effective hosted concurrency limit first. Change `hosted-concurrency.parallelism` (initially 3) to that limit + 1 **before upload**. Ensure the organization job limit is higher. Release the input; provisioned machines hold capacity for ten minutes and excess jobs should wait for hosted capacity. Hosted limits count booting machines, not just running jobs. |
| `platform-limit` | Use an otherwise idle sandbox organization with a known enforced job limit. Change `platform-concurrency.parallelism` (initially 11, for a limit of 10) to the actual limit + 1 **before upload**. Release the input and check for `platform_limited`; if no limit is enforced, do not claim to have reproduced it. |

Hosted machines can incur charges even when an image fails before the command
starts. A job's `timeout_in_minutes` limits **running** time; it does not bound
time spent scheduled, provisioning, or retrying startup. Cancel stuck hosted
jobs promptly after observation. Registry outages or rate limits can also
produce image errors; record the actual hosted error, not just this step label.

## Cases YAML alone cannot reliably force

| Case | How to cover it honestly |
| --- | --- |
| Provisioning (`reserved`) | Requires a real reserving stack or provisioning integration. A normal local agent does not reserve jobs. Hosted startup may expose this state, but do not equate all hosted startup with `reserved`. |
| Agent acceptance (`assigned`) | Observe dispatch to an agent; this state is usually brief. A command or pre-command sleep happens after acceptance and cannot hold this state. A deterministic reproduction needs a separate controlled agent/protocol fixture. |
| Hosted resource quota / generic provider failure | Requires a real quota restriction or provider-side fault. Use an isolated queue with a confirmed incompatible resource request only if authorized. Do not consume arbitrary fleet capacity or invent an error. |
| Job-minute billing limit | Requires a real billing restriction. Do not exhaust a sandbox's allowance to simulate it. |
| Matching idle agent / unknown | The positive controls exercise dispatch with eligible capacity. A brief scheduled observation with idle matches is not proof of a fault. Do not force it with a hidden pause and call the result unknown. |
| Incomplete bounded inspection | Requires the diagnostic implementation and a representative large fleet. A small YAML fixture cannot validate scan bounds, cache coalescing, or prove that no match exists. |
| Permission boundaries | Once the diagnostic exists, view the same job with permitted restricted accounts. Check that queue/agent links and concurrency-blocker details do not reveal inaccessible pipelines or fleet data. YAML cannot create or verify those permissions. |

The lab prepares real inputs for the proposed diagnosis. It does not replace
the plan's large-fleet performance gate or authorization tests.

## Validation and cleanup

Validate locally without starting agents or creating a build:

```sh
for file in .buildkite/pipeline*.yml; do
  bk pipeline validate --file "$file"
  buildkite-agent pipeline upload --dry-run \
    --agent-access-token local-dry-run-placeholder "$file"
done
```

The installed agent requires a placeholder access token even in dry-run mode;
these commands do not upload or use a real credential. Dry-run parses and
interpolates YAML; it does not execute the loader or verify live queue
existence, permissions, provider errors, or resulting scheduler states.

After inspecting a run, cancel the build, resume the dedicated paused agent
(or allow its 15-minute auto-resume), and stop all lab agent processes in their
terminals. Cancelling a build does **not** resume its paused agent. Before
rerunning, confirm the lab agents are connected, idle, and unpaused. Do not
delete shared queues, change organization limits, or leave failed hosted
startup attempts running.
