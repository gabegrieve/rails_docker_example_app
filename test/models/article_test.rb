require "test_helper"

# Model unit test: validations and scopes, backed by fixtures (test/fixtures/articles.yml).
class ArticleTest < ActiveSupport::TestCase
  test "requires a title" do
    article = Article.new(title: nil)
    assert_not article.valid?
    assert_includes article.errors[:title], "can't be blank"
  end

  test "rejects an over-long title" do
    article = Article.new(title: "x" * 121)
    assert_not article.valid?
  end

  test "published scope includes only past, dated articles" do
    titles = Article.published.pluck(:title)

    assert_includes titles, articles(:published_hello).title
    assert_includes titles, articles(:published_pipelines).title
    assert_not_includes titles, articles(:draft_secret).title
    assert_not_includes titles, articles(:scheduled_future).title
  end

  test "published? reflects publish state" do
    assert articles(:published_hello).published?
    assert_not articles(:draft_secret).published?
    assert_not articles(:scheduled_future).published?
  end

  test "body_html renders Markdown" do
    article = Article.new(title: "t", body: "Hello **world**")
    assert_match %r{<strong>world</strong>}, article.body_html
  end

  test "body_html syntax-highlights fenced code blocks" do
    article = Article.new(title: "t", body: "```ruby\nputs :hi\n```")
    # Rouge wraps highlighted code in a .highlight container.
    assert_match %r{class="highlight"}, article.body_html
  end

  test "body_html escapes raw HTML in the body" do
    article = Article.new(title: "t", body: "<script>alert(1)</script>")
    assert_no_match %r{<script>}, article.body_html
    assert_includes article.body_html, "&lt;script&gt;"
  end

  test "accepts a title at the maximum length" do
    assert Article.new(title: "x" * 120).valid?
  end

  test "rejects whitespace-only titles" do
    assert_not Article.new(title: " \t\n").valid?
  end

  test "persists an article with an empty body and no publication date" do
    article = Article.create!(title: "New draft")
    assert_equal "", article.reload.body
    assert_nil article.published_at
    assert_not article.published?
  end

  test "publication starts at the exact scheduled time" do
    freeze_time do
      article = Article.create!(title: "On the boundary", published_at: Time.current)
      assert article.published?
      assert_includes Article.published, article

      article.update!(published_at: 1.second.from_now)
      assert_not article.published?
      assert_not_includes Article.published, article

      travel 1.second
      assert article.published?
      assert_includes Article.published, article
    end
  end

  test "removing the publication date returns an article to draft" do
    article = articles(:published_hello)
    article.update!(published_at: nil)

    assert_not article.reload.published?
    assert_not_includes Article.published, article
  end

  test "body_html handles an absent body" do
    assert_equal "", Article.new(body: nil).body_html
  end

  test "body_html renders headings lists and inline code" do
    html = Article.new(body: "# Setup\n\n- Run `bundle install`\n- Start Rails").body_html
    fragment = Nokogiri::HTML.fragment(html)

    assert_equal "Setup", fragment.at_css("h1").text
    assert_equal [ "Run bundle install", "Start Rails" ], fragment.css("li").map(&:text)
    assert_equal "bundle install", fragment.at_css("code").text
  end

  test "body_html renders tables and strikethrough" do
    html = Article.new(body: "| Tool | Status |\n| --- | --- |\n| Rails | ~~slow~~ fast |").body_html
    fragment = Nokogiri::HTML.fragment(html)

    assert_equal [ "Tool", "Status" ], fragment.css("th").map(&:text)
    assert_equal "slow", fragment.at_css("del").text
  end

  test "body_html automatically links URLs" do
    html = Article.new(body: "Visit https://buildkite.com").body_html
    link = Nokogiri::HTML.fragment(html).at_css("a")

    assert_equal "https://buildkite.com", link["href"]
    assert_equal "https://buildkite.com", link.text
  end

  test "body_html preserves code as text even for an unknown language" do
    html = Article.new(body: "```unknown-language\n<tag>& value\n```").body_html
    fragment = Nokogiri::HTML.fragment(html)

    assert_equal "<tag>& value\n", fragment.at_css("pre").text
    assert_empty fragment.css("tag")
  end

  test "rendering different articles keeps their bodies separate" do
    first = Article.new(body: "**First**")
    second = Article.new(body: "*Second*")

    assert_includes first.body_html, "<strong>First</strong>"
    assert_includes second.body_html, "<em>Second</em>"
    assert_no_match(/Second/, first.body_html)
  end
end
