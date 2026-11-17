require "test_helper"

# Controller test: drives requests through routing and the controller, asserting
# on response status and rendered body.
class ArticlesControllerTest < ActionDispatch::IntegrationTest
  test "index lists published articles" do
    get articles_url
    assert_response :success
    assert_select "#articles li", count: Article.published.count
  end

  test "index hides unpublished articles" do
    get articles_url
    assert_response :success
    assert_select "body" do |body|
      assert_no_match(/Unpublished draft/, body.first.to_s)
    end
  end

  test "show renders an article" do
    article = articles(:published_hello)
    get article_url(article)
    assert_response :success
    assert_select "#article-title", text: article.title
  end

  test "show returns 404 for a missing article" do
    get article_url(id: 0)
    assert_response :not_found
  end

  test "index lists newest articles first" do
    get articles_url

    assert_select "#articles li > a", text: articles(:published_pipelines).title, count: 1
    assert_select "#articles li > a" do |links|
      assert_equal [ articles(:published_pipelines).title, articles(:published_hello).title ], links.map(&:text)
    end
  end

  test "index sends only published article data to the explorer" do
    get articles_url

    assert_select "[data-article-explorer-items]" do |elements|
      items = JSON.parse(elements.first["data-article-explorer-items"])
      assert_equal [ articles(:published_pipelines).id, articles(:published_hello).id ], items.map { |item| item["id"] }
      item = items.last
      assert_equal articles(:published_hello).title, item["title"]
      assert_equal articles(:published_hello).body, item["body"]
      assert_equal articles(:published_hello).published_at.iso8601, item["published_at"]
    end
  end

  test "index renders the empty state when only drafts and scheduled articles exist" do
    Article.published.destroy_all

    get articles_url

    assert_response :success
    assert_select "#empty-state", text: "No articles published yet."
    assert_select "#articles", count: 0
    assert_select "[data-explorer-search]", count: 0
    assert_select "[data-article-explorer-items='[]']"
  end

  test "index safely embeds quotes and HTML in explorer data" do
    article = Article.create!(title: 'A "quoted" <title>', body: '</main><script>alert("x")</script>', published_at: 1.hour.ago)

    get articles_url

    assert_select "#articles a", text: article.title
    assert_select "main.articles", count: 1
    assert_select "script", text: /alert/, count: 0
    assert_select "[data-article-explorer-items]" do |elements|
      item = JSON.parse(elements.first["data-article-explorer-items"]).find { |entry| entry["id"] == article.id }
      assert_equal article.body, item["body"]
      assert_equal article.title, item["title"]
    end
  end

  test "show renders Markdown and the publication date" do
    article = articles(:published_hello)
    article.update!(body: "## Getting started\n\nRead **this** first.")

    get article_url(article)

    assert_select "#article-body h2", text: "Getting started"
    assert_select "#article-body strong", text: "this"
    assert_select ".meta", text: /#{article.published_at.to_date.iso8601}/
    assert_select "a[href=?]", articles_path, text: "← Back to articles"
  end

  test "show escapes HTML in titles and Markdown bodies" do
    article = articles(:published_hello)
    article.update!(title: "<em>Not markup</em>", body: "<script>alert(1)</script>")

    get article_url(article)

    assert_select "#article-title", text: article.title
    assert_select "#article-title em", count: 0
    assert_select "#article-body script", count: 0
  end

  test "root serves the article index" do
    get root_url

    assert_response :success
    assert_select "h1", text: "Articles"
    assert_select "#articles li", count: 2
  end

  test "health check succeeds" do
    get rails_health_check_url

    assert_response :success
  end
end
