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
        <pre><code><span>puts</span> "world"\n</code></pre>
      </article>
    `
    application = Application.start()
    application.register("copy-code", CopyCodeController)
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    application.stop()
    document.body.innerHTML = ""
  })

  it("injects a copy button into each code block", () => {
    expect(document.querySelectorAll(".copy-code-button")).toHaveLength(2)
    expect(document.querySelector(".copy-code-button").textContent).toBe("Copy")
    document.querySelectorAll("pre").forEach((pre) => {
      expect(pre.classList.contains("has-copy-button")).toBe(true)
      expect(pre.querySelector("button").type).toBe("button")
    })
  })

  it("copies the code text and updates the label on click", async () => {
    const button = document.querySelector(".copy-code-button")
    button.click()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(copyMock).toHaveBeenCalledWith("echo hello")
    expect(button.textContent).toBe("Copied!")
  })

  it("copies highlighted text from the selected block without button labels or markup", async () => {
    const buttons = document.querySelectorAll(".copy-code-button")
    buttons[1].click()
    await vi.waitFor(() => expect(buttons[1].textContent).toBe("Copied!"))
    expect(copyMock).toHaveBeenLastCalledWith('puts "world"')
    expect(buttons[0].textContent).toBe("Copy")
    buttons[1].click()
    await vi.waitFor(() => expect(copyMock).toHaveBeenCalledTimes(2))
    expect(copyMock).toHaveBeenLastCalledWith('puts "world"')
  })

  it("shows success only after the clipboard resolves, then resets the label", async () => {
    let finishCopy
    copyMock.mockImplementationOnce(() => new Promise((resolve) => { finishCopy = resolve }))
    vi.useFakeTimers()
    const button = document.querySelector(".copy-code-button")
    button.click()
    expect(button.textContent).toBe("Copy")
    finishCopy()
    await Promise.resolve()
    expect(button.textContent).toBe("Copied!")
    await vi.advanceTimersByTimeAsync(1999)
    expect(button.textContent).toBe("Copied!")
    await vi.advanceTimersByTimeAsync(1)
    expect(button.textContent).toBe("Copy")
  })
})
