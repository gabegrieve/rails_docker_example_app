class CreateArticles < ActiveRecord::Migration[8.1]
  def change
    create_table :articles do |t|
      t.string :title, null: false
      t.text :body, null: false, default: ""
      t.datetime :published_at

      t.timestamps
    end

    add_index :articles, :published_at
  end
end
