/**
 * Fixture for @actions/github context used in tests.
 * Allows mutation of repo, eventName, sha, and payload for test scenarios.
 */
export const context = {
  repo: { owner: '', repo: '' },
  eventName: '',
  sha: '',
  ref: '',
  payload: { pull_request: {} }
}
