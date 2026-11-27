# Buildkite CI

All steps target the `default` queue and run independently, without blocks, waits, matrices, or intentional failures. Agents need Docker with Compose v2 or newer; Ruby, Node, PostgreSQL, and Chromium run in containers.

- **JavaScript tests and build:** installs locked npm dependencies, runs Vitest with JUnit output, and bundles the article explorer with esbuild using Node 24.
- **Ruby tests and lint:** runs RuboCop, prepares PostgreSQL, and runs the model, request, integration, and text utility tests using Ruby 3.4.9.
- **Browser tests:** prepares PostgreSQL and runs Capybara/Selenium tests against headless Chromium, including the real JavaScript bundle.

Each Ruby job uses its own Compose project and database. The cleanup trap removes that project's containers and volumes, including after a failure. Reports and browser-failure screenshots are bind-mounted onto the agent and uploaded as artifacts. The application image builds JavaScript from the lockfile rather than relying on the checked-in bundle.

JavaScript and Ruby CI containers run with the invoking agent's UID/GID, so generated files remain removable during checkout cleanup. `.buildkite/test-ruby` exports `CI_UID`/`CI_GID`, creates bind-mount directories as the agent, and builds application files with matching ownership. Both runtimes use `/tmp` as a writable home for caches. PostgreSQL keeps its image's own user configuration; development-container defaults are unchanged.

If an earlier build left root-owned checkout files, repair that checkout once with `sudo chown -R buildkite-agent:buildkite-agent /path/to/checkout` while no jobs are using it. Substitute the actual agent user and checkout path. The CI changes prevent new ownership problems but do not repair existing files.

## Caching

The JavaScript step uses [Buildkite Cache](https://buildkite.com/docs/pipelines/configure/cache) for npm downloads, not `node_modules` or build output. It looks up the cache by agent OS, architecture, and lockfile checksum, falling back to downloads from an earlier lockfile on the same OS and architecture. `npm ci` still installs from the lockfile on every run. The step saves the cache after the tests and build pass.

Buildkite Cache requires a clustered agent running v4.0.3 or later. Hosted agents have a cache store by default; self-hosted agents need a configured `BUILDKITE_AGENT_CACHE_STORE_URL` and storage credentials. The Ruby and browser jobs rely on Docker's layer cache for gems, npm dependencies, and system packages rather than transferring the application image through Buildkite Cache.

## Run locally

From the repository root:

```sh
npm ci
npm run test:ci
npm run build
bash .buildkite/test-ruby bin/rails test
bash .buildkite/test-ruby bin/rails test:system
```

The Ruby commands build their own image and clean up their database when finished; they do not use the development database. JUnit reports appear in `test/reports/`, and browser-failure screenshots appear in `tmp/screenshots/`.

`BUILDKITE_ANALYTICS_TOKEN` optionally enables the Ruby Buildkite Test Analytics collector. Without a nonblank token, tests still run and produce JUnit reports. No demo slow tests, random failures, or automatic retries mask the results.
