import { describe, it, expect } from "vitest"
import {
  wordCount,
  estimateMinutes,
  formatReadingTime
} from "../../app/javascript/lib/reading_time.js"

// Pure-unit JS tests: no DOM, just the functions.
describe("reading_time helpers", () => {
  describe("wordCount", () => {
    it("counts whitespace-delimited words", () => {
      expect(wordCount("one two three")).toBe(3)
      expect(wordCount("  one   two\nthree  ")).toBe(3)
    })

    it("treats empty and nullish input as zero", () => {
      expect(wordCount("")).toBe(0)
      expect(wordCount(null)).toBe(0)
      expect(wordCount(undefined)).toBe(0)
      expect(wordCount(" \n\t ")).toBe(0)
    })

    it("recognizes Unicode whitespace without treating punctuation as word boundaries", () => {
      expect(wordCount("hello,world\u00a0next\tlast-word")).toBe(3)
    })
  })

  describe("estimateMinutes", () => {
    it("rounds up and never returns less than one", () => {
      expect(estimateMinutes(0)).toBe(1)
      expect(estimateMinutes(200)).toBe(1)
      expect(estimateMinutes(201)).toBe(2)
      expect(estimateMinutes(100, 50)).toBe(2)
    })
  })

  describe("formatReadingTime", () => {
    it("formats a human-readable label", () => {
      const text = Array(450).fill("word").join(" ")
      expect(formatReadingTime(text)).toBe("≈ 3 min read")
    })

    it("uses the requested reading speed and gives empty articles a minimum estimate", () => {
      expect(formatReadingTime(Array(101).fill("word").join(" "), 100)).toBe("≈ 2 min read")
      expect(formatReadingTime("")).toBe("≈ 1 min read")
    })
  })
})
