# Small dependency-free helpers used by Article views and exercised by the
# pure-unit test suite (test/unit/text_utils_test.rb). Kept as a PORO so it can
# be tested without loading Rails or touching the database.
module TextUtils
  module_function

  # Number of whitespace-delimited words in +text+.
  def word_count(text)
    text.to_s.scan(/\S+/).length
  end

  # A truncated, single-line excerpt of +text+ no longer than +limit+ chars.
  def excerpt(text, limit: 80, omission: "…")
    normalized = text.to_s.strip.gsub(/\s+/, " ")
    return normalized if normalized.length <= limit

    "#{normalized[0, limit].rstrip}#{omission}"
  end

  # Estimated reading time in whole minutes, assuming +wpm+ words per minute.
  def reading_minutes(text, wpm: 200)
    [ (word_count(text).to_f / wpm).ceil, 1 ].max
  end
end
