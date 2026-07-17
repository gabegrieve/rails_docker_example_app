import { computePosition, flip, offset, shift } from "@floating-ui/dom"
import { Chart } from "chart.js/auto"
import { format, parseISO } from "date-fns"
import DOMPurify from "dompurify"
import { saveAs } from "file-saver"
import Fuse from "fuse.js"
import hljs from "highlight.js/lib/common"
import localforage from "localforage"
import { sortBy } from "lodash-es"
import { marked } from "marked"
import { nanoid } from "nanoid"
import Papa from "papaparse"
import { z } from "zod"

const Article = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  published_at: z.string()
})

const Articles = z.array(Article)
const stateKey = "article-explorer-state"

export function parseArticles(raw) {
  try {
    return Articles.parse(typeof raw === "string" ? JSON.parse(raw) : raw)
  } catch {
    return []
  }
}

export function formatPublishedDate(value) {
  return format(parseISO(value), "d MMM yyyy")
}

export function filterAndSortArticles(articles, query = "", sort = "newest") {
  const matches = query.trim()
    ? new Fuse(articles, {
        keys: ["title", "body"],
        threshold: 0.35,
        ignoreLocation: true
      }).search(query).map(({ item }) => item)
    : articles

  if (sort === "oldest") return sortBy(matches, "published_at")
  if (sort === "title") return sortBy(matches, (article) => article.title.toLowerCase())
  return sortBy(matches, "published_at").reverse()
}

export function renderPreview(article) {
  const html = marked.parse(article.body, { async: false })
  return DOMPurify.sanitize(html)
}

export async function loadSavedState() {
  try {
    return (await localforage.getItem(stateKey)) || {}
  } catch {
    return {}
  }
}

function saveState(state) {
  localforage.setItem(stateKey, state).catch(() => {})
}

function renderChart(canvas, articles, currentChart) {
  currentChart?.destroy()
  if (!canvas) return null

  const counts = articles.reduce((result, article) => {
    const day = article.published_at.slice(0, 10)
    result[day] = (result[day] || 0) + 1
    return result
  }, {})
  const labels = Object.keys(counts).sort()

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.map(formatPublishedDate),
      datasets: [{
        label: "Published articles",
        data: labels.map((label) => counts[label]),
        backgroundColor: "#14b8a6",
        borderRadius: 4
      }]
    },
    options: {
      animation: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  })
}

function attachTooltip(button, tooltip) {
  const show = async () => {
    tooltip.hidden = false
    const { x, y } = await computePosition(button, tooltip, {
      placement: "top",
      middleware: [offset(8), flip(), shift({ padding: 8 })]
    })
    Object.assign(tooltip.style, { left: `${x}px`, top: `${y}px` })
  }
  const hide = () => { tooltip.hidden = true }
  button.addEventListener("mouseenter", show)
  button.addEventListener("focus", show)
  button.addEventListener("mouseleave", hide)
  button.addEventListener("blur", hide)
}

export function mountArticleExplorer(root) {
  if (root.dataset.explorerMounted === "true") return
  root.dataset.explorerMounted = "true"

  const articles = parseArticles(root.dataset.articleExplorerItems)
  const rows = new Map([...root.querySelectorAll("[data-article-row]")].map((row) => [
    Number(row.dataset.articleId), row
  ]))
  const byId = new Map(articles.map((article) => [article.id, article]))
  const list = root.querySelector("#articles")
  const search = root.querySelector("[data-explorer-search]")
  const sort = root.querySelector("[data-explorer-sort]")
  const status = root.querySelector("[data-explorer-status]")
  const preview = root.querySelector("[data-explorer-preview]")
  const previewTitle = root.querySelector("[data-explorer-preview-title]")
  const previewBody = root.querySelector("[data-explorer-preview-body]")
  const previewLink = root.querySelector("[data-explorer-preview-link]")
  const exportButton = root.querySelector("[data-explorer-export]")
  const exportStatus = root.querySelector("[data-explorer-export-status]")
  const chartCanvas = root.querySelector("[data-explorer-chart]")
  const total = root.querySelector("[data-explorer-total]")
  const latest = root.querySelector("[data-explorer-latest]")
  const tooltip = root.querySelector("[data-explorer-tooltip]")

  // The same page shell is used for the empty state, which has no explorer controls.
  if (!search || !sort || !status || !exportButton) return

  let chart
  let visibleArticles = articles

  const updatePreview = (article) => {
    if (!article || !preview) return
    preview.hidden = false
    previewTitle.textContent = article.title
    previewBody.innerHTML = renderPreview(article)
    previewBody.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block))
    previewLink.href = `/articles/${article.id}`
  }

  const apply = () => {
    visibleArticles = filterAndSortArticles(articles, search.value, sort.value)
    const visibleIds = new Set(visibleArticles.map((article) => article.id))

    visibleArticles.forEach((article) => list?.append(rows.get(article.id)))
    rows.forEach((row, id) => { row.hidden = !visibleIds.has(id) })

    status.textContent = `Showing ${visibleArticles.length} of ${articles.length} articles`
    total.textContent = String(visibleArticles.length)
    latest.textContent = visibleArticles[0] ? formatPublishedDate(visibleArticles[0].published_at) : "—"
    exportButton.disabled = visibleArticles.length === 0
    chart = renderChart(chartCanvas, visibleArticles, chart)
    saveState({ query: search.value, sort: sort.value })
  }

  root.querySelectorAll("[data-preview-id]").forEach((button) => {
    button.addEventListener("click", () => updatePreview(byId.get(Number(button.dataset.previewId))))
  })
  search.addEventListener("input", apply)
  sort.addEventListener("change", apply)
  exportButton.addEventListener("click", () => {
    const csv = Papa.unparse(visibleArticles.map(({ title, published_at, body }) => ({
      title,
      published: formatPublishedDate(published_at),
      body
    })))
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), `articles-${nanoid(6)}.csv`)
    exportStatus.textContent = `Exported ${visibleArticles.length} articles`
  })
  if (tooltip) attachTooltip(exportButton, tooltip)

  loadSavedState().then((saved) => {
    if (saved.query) search.value = saved.query
    if (saved.sort) sort.value = saved.sort
    apply()
  })
  apply()
}
