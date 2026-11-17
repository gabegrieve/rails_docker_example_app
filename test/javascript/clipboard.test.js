import { describe, it, expect } from "vitest"
import { labelFor, codeText } from "../../app/javascript/lib/clipboard.js"

// Pure-unit JS tests: no DOM, no real clipboard — just the helpers.
describe("clipboard helpers", () => {
  describe("labelFor", () => {
    it("reflects the copied state", () => {
      expect(labelFor(false)).toBe("Copy")
      expect(labelFor(true)).toBe("Copied!")
    })
  })

  describe("codeText", () => {
    it("returns the element's text without a trailing newline", () => {
      expect(codeText({ textContent: "echo hi\n" })).toBe("echo hi")
      expect(codeText({ textContent: "one\ntwo" })).toBe("one\ntwo")
    })

    it("treats missing input as empty", () => {
      expect(codeText(null)).toBe("")
      expect(codeText(undefined)).toBe("")
    })

    it("extracts highlighted code while preserving indentation and intentional blank lines", () => {
      const pre = document.createElement("pre")
      pre.innerHTML = '<code><span>if</span> ready\n  run()\n\n</code>'
      expect(codeText(pre)).toBe("if ready\n  run()\n")
    })
  })
})
