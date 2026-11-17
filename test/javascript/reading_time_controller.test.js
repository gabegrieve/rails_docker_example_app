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

  it("counts rendered nested text rather than HTML markup", async () => {
    document.body.innerHTML = `
      <main data-controller="reading-time">
        <span data-reading-time-target="badge"></span>
        <article data-reading-time-target="body"><strong>${Array(200).fill("word").join(" ")}</strong> <em>last</em></article>
      </main>`
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.querySelector("[data-reading-time-target='badge']").textContent).toBe("≈ 2 min read")
  })

  it.each(["body", "badge"])("leaves partial markup alone when the %s target is missing", async (missing) => {
    document.body.innerHTML = `
      <main data-controller="reading-time">
        ${missing === "badge" ? "" : '<span data-reading-time-target="badge">Not calculated</span>'}
        ${missing === "body" ? "" : '<article data-reading-time-target="body">Some text</article>'}
      </main>`
    const before = document.querySelector("main").innerHTML
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.querySelector("main").innerHTML).toBe(before)
    expect(application.getControllerForElementAndIdentifier(document.querySelector("main"), "reading-time")).not.toBeNull()
  })
})
