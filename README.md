# Rails Docker example app

A Rails 8.1 article archive backed by PostgreSQL. Articles render Markdown with syntax highlighting; JavaScript adds reading-time badges, copy-code buttons, and an explorer with search, sorting, previews, charts, saved preferences, and CSV export.

## Development

Docker with Compose is required. Build the explorer and clipboard browser bundles before starting the bind-mounted development app (Node 24 is used in CI):

```sh
npm ci
npm run build
docker compose up --build
```

Open http://localhost:4000. In another terminal, prepare the database and load example articles:

```sh
docker compose exec web bin/rails db:prepare
docker compose exec web bin/rails db:seed
```

Run `npm run build` after changing the article explorer JavaScript. Stimulus controllers and their helpers are delivered through Rails importmaps.

Useful commands:

```sh
docker compose logs -f web
docker compose exec web bin/rails console
docker compose exec web bin/rails db:migrate
docker compose down
```

Rebuild the web image after changing the Gemfile. Database connection settings are read from `DATABASE_HOST`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`; non-Docker defaults are localhost, postgres, and an empty password.

## Tests

The suite covers Ruby validation, publication boundaries, Markdown rendering, request responses and embedded explorer data, text utilities, JavaScript helpers and DOM interactions, and real-browser article flows.

```sh
npm test                          # Vitest with jsdom
npm run test:watch                # Watch JavaScript tests
bash .buildkite/test-ruby bin/rails test         # Ruby tests and RuboCop
bash .buildkite/test-ruby bin/rails test:system  # Headless Chromium tests
```

The Ruby commands use isolated containers and a disposable test database. They leave reports in `test/reports/` and browser-failure screenshots in `tmp/screenshots/`. To use the running development containers instead, run `docker compose exec web bin/rails test` or `docker compose exec web bin/rails test:system`.

Buildkite runs three parallel steps on the `default` queue: JavaScript tests/build, Ruby tests/lint, and browser tests. See [.buildkite/README.md](.buildkite/README.md) for requirements, artifacts, and optional Test Analytics setup.
