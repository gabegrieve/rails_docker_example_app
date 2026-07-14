require "redcarpet"
require "rouge"
require "rouge/plugins/redcarpet"

class Article < ApplicationRecord
  validates :title, presence: true, length: { maximum: 120 }

  scope :published, -> { where.not(published_at: nil).where(published_at: ..Time.current) }

  def published?
    published_at.present? && published_at <= Time.current
  end

  # Render the Markdown body to HTML. Fenced code blocks are syntax-highlighted
  # by Rouge (see MarkdownRenderer). Memoized because rendering is pure for a
  # given body and the view may ask for it more than once.
  def body_html
    @body_html ||= self.class.markdown.render(body.to_s).html_safe
  end

  # Shared Redcarpet instance. Building it once avoids re-parsing the renderer
  # options on every request.
  def self.markdown
    @markdown ||= Redcarpet::Markdown.new(
      MarkdownRenderer.new(escape_html: true, hard_wrap: true),
      autolink: true,
      fenced_code_blocks: true,
      tables: true,
      strikethrough: true
    )
  end

  # HTML renderer that mixes in Rouge's Redcarpet plugin so fenced code blocks
  # come out wrapped in highlight spans instead of a plain <pre><code>.
  class MarkdownRenderer < Redcarpet::Render::HTML
    include Rouge::Plugins::Redcarpet
  end
end
