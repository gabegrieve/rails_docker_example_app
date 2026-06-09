// Pure, framework-free reading-time helpers.
//
// These live in their own module (rather than inside the Stimulus controller)
// so they can be unit-tested by Vitest with no DOM, while the controller that
// uses them gets its own jsdom-backed test. Browser delivery is via importmap
// (see config/importmap.rb); Vitest resolves the same path via an alias in
// vitest.config.js.

export function wordCount(text) {
  const matches = String(text ?? "").match(/\S+/g)
  return matches ? matches.length : 0
}

export function estimateMinutes(words, wordsPerMinute = 200) {
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function formatReadingTime(text, wordsPerMinute = 200) {
  const minutes = estimateMinutes(wordCount(text), wordsPerMinute)
  return `≈ ${minutes} min read`
}
