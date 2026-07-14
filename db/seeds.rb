# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

[
  {
    title: "Hello, Buildkite",
    body: "Welcome to the demo app. This article exists so the homepage has " \
          "something to render and so the seed step in CI has data to create.",
    published_at: 2.days.ago
  },
  {
    title: "Pipelines are fun",
    body: <<~MARKDOWN,
      Buildkite pipelines can do a lot more than run a single test command.
      This repo's `.buildkite/` directory shows off as many features as we
      could fit.

      A pipeline step is just some **YAML**:

      ```yaml
      steps:
        - label: ":test_tube: Tests"
          command: bin/rails test
      ```
    MARKDOWN
    published_at: 1.day.ago
  }
].each do |attrs|
  Article.find_or_create_by!(title: attrs[:title]) do |article|
    article.body = attrs[:body]
    article.published_at = attrs[:published_at]
  end
end
