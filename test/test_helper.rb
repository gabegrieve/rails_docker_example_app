ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

# Make lib/ requireable in tests (e.g. `require "text_utils"`).
$LOAD_PATH.unshift File.expand_path("../lib", __dir__)

# --- Test reporting -----------------------------------------------------------
#
# 1. JUnit XML for the Buildkite junit-annotate plugin. Written to test/reports/
#    and uploaded as an artifact by the pipeline. Enabled whenever we're on CI
#    or when JUNIT_OUTPUT is set, so local runs stay quiet by default.
if ENV["CI"] || ENV["JUNIT_OUTPUT"]
  require "minitest/reporters"
  reports_dir = ENV.fetch("JUNIT_OUTPUT", File.expand_path("reports", __dir__))
  Minitest::Reporters.use!(
    [
      Minitest::Reporters::DefaultReporter.new,
      Minitest::Reporters::JUnitReporter.new(reports_dir)
    ],
    ENV,
    Minitest.backtrace_filter
  )
end

# 2. Buildkite Test Analytics. Only activates when a token is present, so the
#    suite runs fine locally and in forks without one.
if ENV["BUILDKITE_ANALYTICS_TOKEN"]
  require "buildkite/test_collector"
  Buildkite::TestCollector.configure(hook: :minitest)
end
# -----------------------------------------------------------------------------

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end
