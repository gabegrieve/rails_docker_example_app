require "test_helper"

# Intentionally flaky test, OFF by default. Set DEMO_FLAKY=1 to enable it.
#
# It fails ~50% of the time so you can watch Buildkite's automatic retry kick in
# and so Buildkite Test Analytics flags it as flaky. Keeping it gated means the
# default build stays green.
class FlakyTest < ActiveSupport::TestCase
  test "passes only intermittently" do
    skip "set DEMO_FLAKY=1 to exercise retries / flaky detection" unless ENV["DEMO_FLAKY"] == "1"

    assert rand(2).zero?, "unlucky roll — this is the intentional flake"
  end
end
