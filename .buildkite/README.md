# Buildkite feature showcase

This directory contains a deliberately maximalist pipeline that demonstrates as
many Buildkite features as we could fit into one small Rails app. It's meant as
a reference/playground, not a lean production pipeline.

## Files

| File | Purpose |
|---|---|
| `pipeline.yml` | The main showcase pipeline. |
| `scripts/annotate.sh` | Writes one annotation per style (info/success/warning/error). |
| `scripts/dynamic.sh` | Generates steps at runtime for `pipeline upload` (dynamic pipelines). |
| `pipeline.deploy.yml` | Example standalone deploy fragment. |
| `../docker-compose.ci.yml` | CI compose file (test env, matrix-selectable Postgres). |

## Feature → where it's demonstrated

| Buildkite feature | Where |
|---|---|
| Pipeline-level `env` | top of `pipeline.yml` |
| Pipeline-level `notify` (GitHub status; Slack/webhook commented) | top of `pipeline.yml` |
| Queue / agent targeting (cluster default; per-step `agents` optional) | pipeline/cluster settings |
| `command` vs `commands` (array) | Build / Tests steps |
| `key` and `depends_on` | throughout (e.g. `build`, `tests`) |
| `allow_dependency_failure` | JUnit annotate step |
| `wait` and `wait: ~` + `continue_on_failure` | between groups |
| `group` steps | Lint & Security, Tests, Deploy |
| `artifact_paths` | Build, Tests (JUnit + screenshots) |
| `soft_fail` (boolean and by `exit_status`) | Brakeman, audits, trigger |
| `retry` (automatic by exit status + manual) | Ruby tests, System tests |
| `timeout_in_minutes` | Tests |
| `parallelism` | Ruby tests |
| `matrix` (2-dimension) + `adjustments` (soft_fail, skip) | Ruby tests |
| `matrix` (single-dimension) | JS tests (Node versions) |
| `concurrency` + `concurrency_group` | Deploy |
| `priority` | Deploy |
| `cancel_on_build_failing` | Deploy |
| `branches` filter | Deploy |
| `if:` conditionals (`build.branch`, `build.source`) | Input, Deploy |
| `block` step with `fields` (text/select) | Custom annotation, Deploy gate |
| `input` step with `fields` | Release notes |
| `trigger` step (downstream pipeline) | Deploy |
| docker-compose plugin (build / run / image cache) | Build, Lint, Tests |
| artifacts plugin (download) | Annotations demo |
| test-collector plugin (Test Analytics) | Ruby + JS tests |
| junit-annotate plugin | JUnit annotate step |
| monorepo-diff plugin | commented example at the bottom |
| `buildkite-agent annotate` (all styles, `--append`) | `scripts/annotate.sh` |
| `buildkite-agent meta-data set/get` | Build + Annotations demo |
| `buildkite-agent artifact` (via plugin) | Annotations demo |
| Dynamic `pipeline upload` | `scripts/dynamic.sh` |

## What you must wire up for everything to actually run

These are intentionally inert until you configure them:

- **Agents / queue** — jobs route to the cluster's default queue. To target a
  specific queue, use the pipeline's agent targeting field in Buildkite settings,
  or add an `agents: { queue: ... }` block to individual steps. The docker-compose
  plugin steps need an agent with Docker + docker-compose.
- **Test Analytics** — set a `BUILDKITE_ANALYTICS_TOKEN` secret. Without it the
  test-collector plugin and the in-suite collector are no-ops.
- **Slack / webhook notifications** — uncomment in `notify:` and configure a
  Notification Service in your org.
- **`trigger` step** — create a pipeline with slug `downstream-smoke-tests` (or
  rename the trigger).
- **System tests** — need a Chrome/Chromedriver-capable image. `Dockerfile.dev`
  doesn't install Chrome yet; add it (or a `selenium` service) to make the
  `:chrome: System tests` step pass.

## Toggles

- `DEMO_FLAKY=1` enables `test/unit/flaky_test.rb`, which fails ~50% of the time
  so you can watch automatic retries and Test Analytics flaky detection.
