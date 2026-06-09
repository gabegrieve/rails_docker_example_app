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
end
