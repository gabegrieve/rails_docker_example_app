require "test_helper"
require "text_utils"

# Pure unit test: no database, no Rails fixtures, no HTTP. The fastest kind of
# test in the suite — exercises plain Ruby in TextUtils.
class TextUtilsTest < ActiveSupport::TestCase
  test "word_count counts whitespace-delimited words" do
    assert_equal 0, TextUtils.word_count("")
    assert_equal 0, TextUtils.word_count(nil)
    assert_equal 3, TextUtils.word_count("one two three")
    assert_equal 3, TextUtils.word_count("  one   two\nthree  ")
  end

  test "excerpt leaves short text untouched" do
    assert_equal "short", TextUtils.excerpt("short", limit: 80)
  end

  test "excerpt truncates and appends omission" do
    result = TextUtils.excerpt("a" * 100, limit: 10)
    assert_equal "aaaaaaaaaa…", result
    assert_equal 11, result.length
  end

  test "excerpt collapses internal whitespace" do
    assert_equal "one two three", TextUtils.excerpt("one   two\n\nthree")
  end

  test "reading_minutes is at least one minute" do
    assert_equal 1, TextUtils.reading_minutes("a few words")
    assert_equal 2, TextUtils.reading_minutes("word " * 300, wpm: 200)
  end
end
