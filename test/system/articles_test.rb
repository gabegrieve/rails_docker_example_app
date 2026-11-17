require "application_system_test_case"

# System test: drives a real (headless Chrome) browser via Capybara/Selenium.
# This is the test type that loads the Stimulus reading-time controller, so it
# also verifies the JavaScript-rendered badge. Failures produce screenshots,
# which the Buildkite pipeline uploads as artifacts.
class ArticlesTest < ApplicationSystemTestCase
  test "visiting the index" do
    visit articles_url

    assert_selector "h1", text: "Articles"
    assert_link articles(:published_hello).title
  end

  test "searching filters articles and recovers from no matches" do
    visit articles_url

    assert_selector "[data-explorer-status]", text: "Showing 2 of 2 articles"
    find("[data-explorer-search]").set("Pipelines")
    assert_selector "#articles li", count: 1
    assert_link articles(:published_pipelines).title
    assert_no_link articles(:published_hello).title

    find("[data-explorer-search]").set("zzzzzzzzzzzz")
    assert_selector "[data-explorer-status]", text: "Showing 0 of 2 articles"
    assert_button "Export CSV", disabled: true
    assert_selector "#articles li", count: 0

    find("[data-explorer-search]").set("")
    assert_selector "#articles li", count: 2
    assert_button "Export CSV", disabled: false
  end

  test "sorting changes the article order" do
    visit articles_url
    assert_selector "[data-explorer-status]", text: "Showing 2 of 2 articles"

    find("[data-explorer-sort]").select("Oldest first")
    assert_equal [ articles(:published_hello).title, articles(:published_pipelines).title ], all("#articles li > a").map(&:text)

    find("[data-explorer-sort]").select("Newest first")
    assert_equal [ articles(:published_pipelines).title, articles(:published_hello).title ], all("#articles li > a").map(&:text)
  end

  test "preview opens the selected article" do
    article = articles(:published_hello)
    visit articles_url
    assert_selector "[data-explorer-status]", text: "Showing 2 of 2 articles"

    within("[data-article-id='#{article.id}']") { click_button "Preview" }
    within("[data-explorer-preview]") do
      assert_selector "h2", text: article.title
      assert_text article.body
      click_link "Read full article"
    end

    assert_selector "h1#article-title", text: article.title
  end

  test "an empty archive renders without explorer controls" do
    Article.published.destroy_all
    visit articles_url

    assert_text "No articles published yet."
    assert_no_selector "[data-explorer-search]"
    assert_no_button "Export CSV"
  end

  test "code blocks get copy buttons on the article page" do
    article = articles(:published_hello)
    article.update!(body: "```ruby\nputs :hello\n```\n\n```sh\necho world\n```")
    visit article_url(article)

    assert_selector "#article-body pre", count: 2
    assert_selector "#article-body button", text: "Copy", count: 2
  end

  test "reading an article shows the stimulus reading-time badge" do
    article = articles(:published_hello)

    visit articles_url
    click_on article.title

    assert_selector "h1#article-title", text: article.title
    # The reading-time Stimulus controller fills this in client-side.
    assert_selector "[data-reading-time-target='badge']", text: /min read/
  end
end
