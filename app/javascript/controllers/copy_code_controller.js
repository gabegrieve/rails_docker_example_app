import { Controller } from "@hotwired/stimulus"
import { labelFor, codeText, copyText } from "lib/clipboard"

// Injects a "Copy" button into every code block inside its element and copies
// that block's text to the clipboard on click. Wired up on the article show
// page via data-controller="copy-code" on the article body.
export default class extends Controller {
  connect() {
    this.element.querySelectorAll("pre").forEach((pre) => this.#addButton(pre))
  }

  #addButton(pre) {
    // Capture the code text up front, before the button becomes a child of the
    // <pre> — otherwise the button's own label would leak into pre.textContent.
    const text = codeText(pre)

    const button = document.createElement("button")
    button.type = "button"
    button.className = "copy-code-button"
    button.textContent = labelFor(false)
    button.addEventListener("click", () => this.#copy(text, button))

    // Anchor the button relative to the block it copies.
    pre.classList.add("has-copy-button")
    pre.appendChild(button)
  }

  async #copy(text, button) {
    await copyText(text)
    button.textContent = labelFor(true)
    setTimeout(() => { button.textContent = labelFor(false) }, 2000)
  }
}
