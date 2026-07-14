// Pure, framework-free clipboard helpers.
//
// Like lib/reading_time.js, these live in their own module so the pure bits can
// be unit-tested by Vitest with no DOM, while the Stimulus controller that uses
// them gets its own jsdom-backed test. Browser delivery is via importmap (see
// config/importmap.rb); Vitest resolves the same path via an alias in
// vitest.config.js. The actual copy is delegated to the `clipboard-copy` npm
// package so we don't hand-roll the execCommand/Clipboard-API fallback dance.
import copy from "clipboard-copy"

// Label shown on a copy button for a given state.
export function labelFor(copied) {
  return copied ? "Copied!" : "Copy"
}

// Extract the code text from a rendered code block. Rouge wraps highlighted
// code in <div class="highlight"><pre>…</pre></div>; we just want the text.
export function codeText(element) {
  return String(element?.textContent ?? "").replace(/\n$/, "")
}

// Copy the given text to the clipboard. Returns the clipboard-copy promise so
// callers can react to success/failure.
export function copyText(text) {
  return copy(text)
}
