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
  end
end
