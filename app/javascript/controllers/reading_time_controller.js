import { Controller } from "@hotwired/stimulus"
import { formatReadingTime } from "lib/reading_time"

// Renders an estimated reading time into the badge target based on the text
// content of the body target. Wired up on the article show page via
// data-controller="reading-time".
export default class extends Controller {
  static targets = [ "body", "badge" ]

  connect() {
    if (this.hasBodyTarget && this.hasBadgeTarget) {
      this.badgeTarget.textContent = formatReadingTime(this.bodyTarget.textContent)
    }
  }
}
