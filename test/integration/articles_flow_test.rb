require "test_helper"

# Integration test: follows a multi-request user flow across the app — landing
# on the index, then clicking through to an article.
class ArticlesFlowTest < ActionDispatch::IntegrationTest
  test "browse from the index to an article and back" do
    article = articles(:published_hello)

    get root_path
    assert_response :success
    assert_select "a[href=?]", article_path(article), text: article.title

    get article_path(article)
    assert_response :success
    assert_select "h1#article-title", text: article.title

    get articles_path
    assert_response :success
  end
end
