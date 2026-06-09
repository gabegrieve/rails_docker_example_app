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

  test "reading an article shows the stimulus reading-time badge" do
    article = articles(:published_hello)

    visit articles_url
    click_on article.title

    assert_selector "h1#article-title", text: article.title
    # The reading-time Stimulus controller fills this in client-side.
    assert_selector "[data-reading-time-target='badge']", text: /min read/
  end
end
