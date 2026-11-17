require "test_helper"
require "text_utils"

class TextUtilsTest < ActiveSupport::TestCase
  test "word_count counts whitespace-delimited words" do
    assert_equal 0, TextUtils.word_count("")
    assert_equal 0, TextUtils.word_count(nil)
    assert_equal 3, TextUtils.word_count("one two three")
    assert_equal 3, TextUtils.word_count("  one\ttwo\nthree  ")
  end

  test "word_count preserves punctuation and unicode within words" do
    assert_equal 3, TextUtils.word_count("Hello, café 世界!")
    assert_equal 1, TextUtils.word_count("well-known")
  end

  test "excerpt leaves text at the limit untouched" do
    assert_equal "short", TextUtils.excerpt("short", limit: 5)
  end

  test "excerpt truncates text beyond the limit and appends omission" do
    assert_equal "short…", TextUtils.excerpt("shorter", limit: 5)
  end

  test "excerpt strips and collapses whitespace before measuring length" do
    assert_equal "one two", TextUtils.excerpt("  one\t two\n ", limit: 7)
  end

  test "excerpt strips trailing whitespace from a truncated result" do
    assert_equal "one…", TextUtils.excerpt("one two three", limit: 4)
  end

  test "excerpt supports a custom or empty omission" do
    assert_equal "one [more]", TextUtils.excerpt("one two", limit: 3, omission: " [more]")
    assert_equal "one", TextUtils.excerpt("one two", limit: 3, omission: "")
  end

  test "excerpt handles empty input and a zero length limit" do
    assert_equal "", TextUtils.excerpt(nil)
    assert_equal "", TextUtils.excerpt(" \n\t ")
    assert_equal "…", TextUtils.excerpt("hello", limit: 0)
  end

  test "excerpt counts unicode characters rather than bytes" do
    assert_equal "café…", TextUtils.excerpt("café 世界", limit: 4)
  end

  test "reading_minutes is at least one for empty or short text" do
    assert_equal 1, TextUtils.reading_minutes(nil)
    assert_equal 1, TextUtils.reading_minutes("a few words")
  end

  test "reading_minutes rounds up only after a full minute boundary" do
    assert_equal 1, TextUtils.reading_minutes("word " * 200)
    assert_equal 2, TextUtils.reading_minutes("word " * 201)
    assert_equal 2, TextUtils.reading_minutes("word " * 400)
  end

  test "reading_minutes accepts a custom reading speed" do
    assert_equal 3, TextUtils.reading_minutes("word " * 101, wpm: 50)
  end
end
