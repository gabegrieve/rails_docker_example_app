import { mountArticleExplorer } from "./lib/article_explorer.js"

const mount = () => {
  document.querySelectorAll("[data-article-explorer]").forEach(mountArticleExplorer)
}

document.addEventListener("turbo:load", mount)
document.addEventListener("DOMContentLoaded", mount)
mount()
