import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Papa from "papaparse"
import localforage from "localforage"
import { saveAs } from "file-saver"
import { mountArticleExplorer } from "../../app/javascript/lib/article_explorer.js"

// jsdom has no canvas renderer, download destination, or persistent storage.
vi.mock("chart.js/auto", () => ({ Chart: vi.fn(function () { this.destroy = vi.fn() }) }))
vi.mock("file-saver", () => ({ saveAs: vi.fn() }))
vi.mock("localforage", () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }))

const articles = [
  { id: 1, title: "Zebra pipelines", body: "Cache **pipelines**", published_at: "2026-07-15T12:00:00Z" },
  { id: 2, title: "apple caching", body: 'Cache, "reuse"\nand rebuild.', published_at: "2026-07-17T12:00:00Z" },
  { id: 3, title: "Markdown guide", body: "# Safe preview\n\n[Documentation](https://example.com/docs)\n\n<img src=x onerror=alert(1)><script>alert(1)</script>\n\n[Unsafe](javascript:alert(1))\n\n```ruby\nputs 'hello'\n```", published_at: "2026-07-16T12:00:00Z" }
]

function page() {
  document.body.innerHTML = `
    <main data-article-explorer>
      <input data-explorer-search type="search">
      <select data-explorer-sort>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="title">Title</option>
      </select>
      <p data-explorer-status role="status"></p>
      <strong data-explorer-total></strong><strong data-explorer-latest></strong>
      <canvas data-explorer-chart></canvas>
      <button data-explorer-export>Export CSV</button>
      <span data-explorer-export-status role="status"></span>
      <ul id="articles"></ul>
      <aside data-explorer-preview hidden>
        <h2 data-explorer-preview-title></h2>
        <div data-explorer-preview-body></div>
        <a data-explorer-preview-link>Read full article</a>
      </aside>
    </main>`
  const root = document.querySelector("main")
  root.dataset.articleExplorerItems = JSON.stringify(articles)
  articles.forEach(({ id, title }) => {
    const row = document.createElement("li")
    row.dataset.articleRow = ""
    row.dataset.articleId = String(id)
    row.textContent = title
    const button = document.createElement("button")
    button.dataset.previewId = String(id)
    button.textContent = "Preview"
    row.append(button)
    root.querySelector("#articles").append(row)
  })
  return root
}

const get = (name) => document.querySelector(`[data-explorer-${name}]`)
const visibleIds = () => [...document.querySelectorAll("[data-article-row]")]
  .filter((row) => !row.hidden).map((row) => Number(row.dataset.articleId))

function searchFor(query) {
  get("search").value = query
  get("search").dispatchEvent(new Event("input", { bubbles: true }))
}

function sortBy(value) {
  get("sort").value = value
  get("sort").dispatchEvent(new Event("change", { bubbles: true }))
}

async function mount() {
  const root = page()
  mountArticleExplorer(root)
  // Allow the asynchronous storage read and subsequent render to finish.
  await new Promise((resolve) => setTimeout(resolve, 0))
  return root
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe("article explorer DOM", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localforage.getItem.mockResolvedValue(null)
    localforage.setItem.mockResolvedValue(undefined)
  })

  afterEach(() => { document.body.innerHTML = "" })

  it("renders newest first, filters by body text, and reorders the remaining rows", async () => {
    await mount()
    expect(visibleIds()).toEqual([2, 3, 1])
    expect(get("status").textContent).toBe("Showing 3 of 3 articles")
    expect(get("latest").textContent).toBe("17 Jul 2026")
    searchFor("cache")
    expect(visibleIds()).toEqual([2, 1])
    expect(get("status").textContent).toBe("Showing 2 of 3 articles")
    expect(get("total").textContent).toBe("2")
    sortBy("oldest")
    expect(visibleIds()).toEqual([1, 2])
    sortBy("title")
    expect(visibleIds()).toEqual([2, 1])
    expect(localforage.setItem).toHaveBeenLastCalledWith("article-explorer-state", { query: "cache", sort: "title" })
  })

  it("disables exporting when there are no results and recovers when search is cleared", async () => {
    await mount()
    searchFor("zzzzzzzzzzzzzzzz")
    expect(visibleIds()).toEqual([])
    expect(get("status").textContent).toBe("Showing 0 of 3 articles")
    expect(get("total").textContent).toBe("0")
    expect(get("latest").textContent).toBe("—")
    expect(get("export").disabled).toBe(true)
    get("export").click()
    expect(saveAs).not.toHaveBeenCalled()
    searchFor("")
    expect(visibleIds()).toEqual([2, 3, 1])
    expect(get("export").disabled).toBe(false)
  })

  it("opens a sanitized Markdown preview and links to the selected article", async () => {
    await mount()
    expect(get("preview").hidden).toBe(true)
    document.querySelector('[data-preview-id="3"]').click()
    expect(get("preview").hidden).toBe(false)
    expect(get("preview-title").textContent).toBe("Markdown guide")
    const body = get("preview-body")
    expect(body.querySelector("h1").textContent).toBe("Safe preview")
    expect(body.querySelector('a[href="https://example.com/docs"]').textContent).toBe("Documentation")
    expect(body.querySelector("script, [onerror], a[href^='javascript:']")).toBeNull()
    expect(body.querySelector("pre code").textContent).toBe("puts 'hello'\n")
    expect(get("preview-link").getAttribute("href")).toBe("/articles/3")
    document.querySelector('[data-preview-id="1"]').click()
    expect(get("preview-title").textContent).toBe("Zebra pipelines")
    expect(body.querySelector("strong").textContent).toBe("pipelines")
    expect(body.querySelector("h1")).toBeNull()
    expect(get("preview-link").getAttribute("href")).toBe("/articles/1")
  })

  it("restores the saved query and sort into both controls and results", async () => {
    localforage.getItem.mockResolvedValue({ query: "cache", sort: "oldest" })
    await mount()
    expect(get("search").value).toBe("cache")
    expect(get("sort").value).toBe("oldest")
    expect(visibleIds()).toEqual([1, 2])
    expect(get("status").textContent).toBe("Showing 2 of 3 articles")
  })

  it("remains usable when reading and writing persistent storage fail", async () => {
    localforage.getItem.mockRejectedValue(new Error("Storage unavailable"))
    localforage.setItem.mockRejectedValue(new Error("Quota exceeded"))
    await mount()
    searchFor("markdown")
    expect(visibleIds()).toEqual([3])
    expect(get("status").textContent).toBe("Showing 1 of 3 articles")
  })

  it("downloads only the current results, in selected order, as properly escaped CSV", async () => {
    await mount()
    searchFor("cache")
    sortBy("oldest")
    get("export").click()
    expect(saveAs).toHaveBeenCalledTimes(1)
    const [blob, filename] = saveAs.mock.calls[0]
    expect(blob.type).toBe("text/csv;charset=utf-8")
    expect(filename).toMatch(/^articles-[\w-]{6}\.csv$/)
    const result = Papa.parse(await readBlob(blob), { header: true })
    expect(result.errors).toEqual([])
    expect(result.meta.fields).toEqual(["title", "published", "body"])
    expect(result.data).toEqual([
      { title: "Zebra pipelines", published: "15 Jul 2026", body: "Cache **pipelines**" },
      { title: "apple caching", published: "17 Jul 2026", body: 'Cache, "reuse"\nand rebuild.' }
    ])
    expect(get("export-status").textContent).toBe("Exported 2 articles")
  })

  it("does not duplicate event handlers when the same root is mounted again", async () => {
    const root = await mount()
    mountArticleExplorer(root)
    get("export").click()
    expect(saveAs).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll("[data-article-row]")).toHaveLength(3)
  })

  it("accepts the empty-state page without explorer controls", () => {
    document.body.innerHTML = '<main data-article-explorer><p>No articles published yet.</p></main>'
    const root = document.querySelector("main")
    root.dataset.articleExplorerItems = "[]"
    expect(() => mountArticleExplorer(root)).not.toThrow()
    expect(root.textContent).toBe("No articles published yet.")
    expect(localforage.getItem).not.toHaveBeenCalled()
  })
})
