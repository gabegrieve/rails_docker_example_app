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
end
