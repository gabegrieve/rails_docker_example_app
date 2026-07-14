import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"

// Mock the real clipboard package: jsdom has no working clipboard, and the unit
// under test is the controller's DOM behaviour, not the copy transport.
// vi.hoisted lets the mock fn exist before vi.mock's hoisted factory runs.
const { copyMock } = vi.hoisted(() => ({ copyMock: vi.fn(() => Promise.resolve()) }))
vi.mock("clipboard-copy", () => ({ default: copyMock }))

import CopyCodeController from "../../app/javascript/controllers/copy_code_controller.js"

// DOM-backed JS test: boots a real Stimulus application against jsdom and
// asserts the controller injects a copy button and wires it to the clipboard.
describe("CopyCodeController", () => {
  let application

  beforeEach(async () => {
    copyMock.mockClear()
    document.body.innerHTML = `
      <article data-controller="copy-code">
        <pre>echo hello\n</pre>
      </article>
    `
    application = Application.start()
    application.register("copy-code", CopyCodeController)
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("injects a copy button into each code block", () => {
    expect(document.querySelectorAll(".copy-code-button")).toHaveLength(1)
    expect(document.querySelector(".copy-code-button").textContent).toBe("Copy")
  })

  it("copies the code text and updates the label on click", async () => {
    const button = document.querySelector(".copy-code-button")
    button.click()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(copyMock).toHaveBeenCalledWith("echo hello")
    expect(button.textContent).toBe("Copied!")
  })
})
