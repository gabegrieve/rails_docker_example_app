import { describe, it, expect } from "vitest"
import {
  filterAndSortArticles,
  formatPublishedDate,
  parseArticles,
  renderPreview
} from "../../app/javascript/lib/article_explorer.js"

const articles = [
  { id: 1, title: "Zebra pipelines", body: "Buildkite keeps teams moving.", published_at: "2026-07-15T00:00:00.000Z" },
  { id: 2, title: "Article caching", body: "A cache makes builds faster.", published_at: "2026-07-16T00:00:00.000Z" }
]

describe("article explorer helpers", () => {
  it("validates and parses article data", () => {
    expect(parseArticles(JSON.stringify(articles))).toEqual(articles)
    expect(parseArticles(articles)).toEqual(articles)
    expect(parseArticles("not json")).toEqual([])
    expect(parseArticles([{ id: "wrong" }])).toEqual([])
  })

  it.each([
    [null],
    [{}],
    [{ articles }],
    [[articles[0], { ...articles[1], body: null }]],
    [[{ ...articles[0], id: "1" }]],
    [[{ ...articles[0], published_at: undefined }]]
  ])("rejects invalid payloads without keeping partially valid articles: %j", (raw) => {
    expect(parseArticles(raw)).toEqual([])
  })

  it("fuzzy-searches article titles and bodies, then sorts results", () => {
    expect(filterAndSortArticles(articles, "cache").map((article) => article.id)).toEqual([2])
    expect(filterAndSortArticles(articles, "BUILDKITE").map((article) => article.id)).toEqual([1])
    expect(filterAndSortArticles(articles, "pipline").map((article) => article.id)).toEqual([1])
    expect(filterAndSortArticles(articles, "", "title").map((article) => article.id)).toEqual([2, 1])
    expect(filterAndSortArticles(articles, "", "oldest").map((article) => article.id)).toEqual([1, 2])
  })

  it("treats whitespace as no filter and does not mutate the input order", () => {
    const input = Object.freeze(articles.map((article) => Object.freeze({ ...article })))
    expect(filterAndSortArticles(input).map(({ id }) => id)).toEqual([2, 1])
    expect(filterAndSortArticles(input, " \n\t ").map(({ id }) => id)).toEqual([2, 1])
    expect(input.map(({ id }) => id)).toEqual([1, 2])
    expect(filterAndSortArticles([], "cache", "title")).toEqual([])
  })

  it("sorts titles case-insensitively rather than grouping capitals first", () => {
    const mixed = [{ ...articles[0], title: "Zebra" }, { ...articles[1], title: "apple" }]
    expect(filterAndSortArticles(mixed, "", "title").map(({ id }) => id)).toEqual([2, 1])
  })

  it("formats dates for the explorer", () => {
    expect(formatPublishedDate("2026-07-16T00:00:00.000Z")).toBe("16 Jul 2026")
  })

  it("renders markdown and removes unsafe HTML", () => {
    const html = renderPreview({ id: 1, title: "Demo", body: "**Hello** <script>alert(1)</script>" })
    expect(html).toContain("<strong>Hello</strong>")
    expect(html).not.toContain("script")
  })
})
