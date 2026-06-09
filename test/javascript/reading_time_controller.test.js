import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { Application } from "@hotwired/stimulus"
import ReadingTimeController from "../../app/javascript/controllers/reading_time_controller.js"

// DOM-backed JS test: boots a real Stimulus application against a jsdom document
// and asserts the controller renders the reading-time badge on connect.
describe("ReadingTimeController", () => {
  let application

  beforeEach(async () => {
    document.body.innerHTML = `
      <main data-controller="reading-time">
        <span data-reading-time-target="badge"></span>
        <article data-reading-time-target="body">${Array(450).fill("word").join(" ")}</article>
      </main>
    `
    application = Application.start()
    application.register("reading-time", ReadingTimeController)
    // Let Stimulus run its connect lifecycle.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("writes a reading-time estimate into the badge", () => {
    const badge = document.querySelector("[data-reading-time-target='badge']")
    expect(badge.textContent).toBe("≈ 3 min read")
  })
})
