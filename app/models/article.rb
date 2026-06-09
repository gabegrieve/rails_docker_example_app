class Article < ApplicationRecord
  validates :title, presence: true, length: { maximum: 120 }

  scope :published, -> { where.not(published_at: nil).where(published_at: ..Time.current) }

  def published?
    published_at.present? && published_at <= Time.current
  end
end
