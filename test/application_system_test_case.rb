require "test_helper"

# Register a headless Chrome/Chromium driver. In CI (and any container) the
# Dockerfile installs Chromium + a matching chromedriver and exports CHROME_BIN
# / CHROMEDRIVER_BIN; we point Selenium at those so it doesn't try to download a
# driver that has no matching browser. Locally (e.g. macOS) those vars are
# unset, so Selenium Manager resolves the browser and driver as usual.
Capybara.register_driver :app_headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument("--headless=new")
  options.add_argument("--disable-gpu")
  options.add_argument("--window-size=1400,1400")

  if ENV["CHROME_BIN"]
    options.binary = ENV["CHROME_BIN"]
    # Chromium runs as root in the container, which requires these.
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
  end

  service =
    if ENV["CHROMEDRIVER_BIN"]
      Selenium::WebDriver::Chrome::Service.new(path: ENV["CHROMEDRIVER_BIN"])
    end

  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options, service: service)
end

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :app_headless_chrome
end
