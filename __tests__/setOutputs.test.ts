import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@actions/core', () => core)

const { setOutputs, normalizeBranch, normalizeDevPort } = await import(
  '../src/setOutputs.js'
)

describe('setOutputs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    core.getInput.mockImplementation((name: string) => {
      if (name === 'environment') return 'dev'
      if (name === 'gitops-repo-suffix') return '-gitops'
      return ''
    })
    process.env.GITOPS_REPO = 'Octocat/MyApp-gitops'
    process.env.GITOPS_FILE_PATH = ''
    process.env.GITOPS_FILE_NAME = ''
    process.env.APP_NAME = ''
    process.env.DOMAIN = ''
    process.env.DEV_SCHEMA = ''
    process.env.DEV_PORT = ''
    github.context.repo = { owner: 'Octocat', repo: 'MyApp' }
    github.context.ref = 'refs/heads/FEature/branch_main'
    // @ts-expect-error mocking missing repo

    github.context.payload = {}
  })

  it('sets all expected outputs with default environment variables', async () => {
    await setOutputs()
    // console.error(core.setOutput.mock.calls)
    expect(core.setOutput).toHaveBeenCalledWith(
      'target-namespace',
      'myapp-feature-branch-main'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'subdomain',
      'feature-branch-main'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'start-time',
      expect.any(Number)
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-repo',
      'Octocat/MyApp-gitops'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-file',
      'deploy/environments/dev/values.yaml'
    )
    expect(core.setOutput).toHaveBeenCalledWith('app-name', 'MyApp')
    expect(core.setOutput).toHaveBeenCalledWith(
      'local-service-fqdn',
      'MyApp.feature-branch-main.svc.cluster.local'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'public-service-fqdn',
      'MyApp.feature-branch-main.example.com'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'http://MyApp.feature-branch-main.example.com'
    )
  })

  it('uses environment variables when provided', async () => {
    process.env.GITOPS_REPO = 'octocat/customrepo-gitops'
    process.env.GITOPS_FILE_PATH = 'custom/path'
    process.env.GITOPS_FILE_NAME = 'custom.yaml'
    process.env.APP_NAME = 'customapp'
    process.env.DOMAIN = 'custom.com'
    process.env.DEV_SCHEMA = 'https://'
    process.env.DEV_PORT = '443'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-repo',
      'octocat/customrepo-gitops'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-file',
      'custom/path/dev/custom.yaml'
    )
    expect(core.setOutput).toHaveBeenCalledWith('app-name', 'customapp')
    expect(core.setOutput).toHaveBeenCalledWith(
      'public-service-fqdn',
      'customapp.feature-branch-main.custom.com'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'https://customapp.feature-branch-main.custom.com'
    )
  })

  it('normalizes branch names and repo names', async () => {
    github.context.ref = 'refs/heads/FeaTURE/Br@nch_42'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'target-namespace',
      'myapp-feature-br-nch-42'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'subdomain',
      'feature-br-nch-42'
    )
  })

  it('throws error if github.context.ref is missing', async () => {
    github.context.ref = ''
    await expect(setOutputs()).rejects.toThrow(
      'github.context.ref is undefined. Cannot determine branch name.'
    )
  })

  it('throws error if tag ref is detected', async () => {
    github.context.ref = 'refs/tags/v1.0.0'
    await expect(setOutputs()).rejects.toThrow('Tag detected, not a branch')
  })

  it('sets service-url without port for http and port 80', async () => {
    process.env.DEV_SCHEMA = 'http://'
    process.env.DEV_PORT = '80'
    process.env.APP_NAME = 'testapp'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'http://testapp.feature-branch-main.example.com'
    )
  })

  it('sets service-url without port for https and port 443', async () => {
    process.env.DEV_SCHEMA = 'https://'
    process.env.DEV_PORT = '443'
    process.env.APP_NAME = 'testapp'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'https://testapp.feature-branch-main.example.com'
    )
  })

  it('sets service-url with custom port for http', async () => {
    process.env.DEV_SCHEMA = 'http://'
    process.env.DEV_PORT = '8080'
    process.env.APP_NAME = 'testapp'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'http://testapp.feature-branch-main.example.com:8080'
    )
  })

  it('sets service-url with custom port for https', async () => {
    process.env.DEV_SCHEMA = 'https://'
    process.env.DEV_PORT = '8443'
    process.env.APP_NAME = 'testapp'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'https://testapp.feature-branch-main.example.com:8443'
    )
  })

  it('sets service-url with empty port', async () => {
    process.env.DEV_SCHEMA = 'http://'
    process.env.DEV_PORT = ''
    process.env.APP_NAME = 'testapp'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'service-url',
      'http://testapp.feature-branch-main.example.com:'.replace(/:$/, '')
    )
  })

  it('throws error for non-numeric port', async () => {
    process.env.DEV_SCHEMA = 'http://'
    process.env.DEV_PORT = 'abc'
    process.env.APP_NAME = 'testapp'
    await expect(setOutputs()).rejects.toThrow('DEV_PORT must be a number')
  })
  it('throws error for push tag', async () => {
    github.context.ref = 'refs/tags/v1.2.2'
    await expect(setOutputs()).rejects.toThrow('Tag detected, not a branch')
  })
  it('throws error for unknown ref', async () => {
    github.context.ref = 'refs/unknown/ref'
    await expect(setOutputs()).rejects.toThrow(
      'Unknown ref format refs/unknown/ref'
    )
  })

  it('uses PR branch name when payload.pull_request is present', async () => {
    github.context.payload.pull_request = { head: { ref: 'pr-branch' } }
    github.context.ref = 'refs/heads/ignored-branch'
    github.context.repo = { owner: 'Octocat', repo: 'MyApp' }
    process.env.GITOPS_REPO = ''
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'target-namespace',
      'myapp-pr-branch'
    )
    expect(core.setOutput).toHaveBeenCalledWith('subdomain', 'pr-branch')
  })
})

describe('edge cases for repo and env vars', () => {
  beforeEach(() => {
    // @ts-expect-error mocking missing repo

    github.context.payload = {}
  })
  it('falls back to repo name if GITOPS_REPO is empty', async () => {
    process.env.GITOPS_REPO = ''
    github.context.repo = { owner: 'Octocat', repo: 'MyApp' }
    github.context.ref = 'refs/heads/main'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-repo',
      'Octocat/MyApp-gitops'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'target-namespace',
      'myapp-main'
    )
  })

  it('handles malformed GITOPS_REPO (no slash)', async () => {
    process.env.GITOPS_REPO = 'malformedgitopsrepo'
    github.context.repo = { owner: 'Octocat', repo: 'MyApp' }
    github.context.ref = 'refs/heads/main'
    await setOutputs()
    expect(core.setOutput).toHaveBeenCalledWith(
      'gitops-repo',
      'malformedgitopsrepo'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'target-namespace',
      'malformedgitopsrepo-main'
    )
  })

  it('throws if github.context.repo is missing', async () => {
    // @ts-expect-error mocking missing repo
    github.context.repo = undefined
    await expect(setOutputs()).rejects.toThrow()
  })
})

describe('normalizeDevPort', () => {
  it('returns empty string for http default port', () => {
    expect(normalizeDevPort('http://', '80')).toBe('')
  })
  it('returns empty string for https default port', () => {
    expect(normalizeDevPort('https://', '443')).toBe('')
  })
  it('returns :8080 for custom numeric port', () => {
    expect(normalizeDevPort('http://', '8080')).toBe(':8080')
  })
  it('returns :3000 for custom numeric port with https', () => {
    expect(normalizeDevPort('https://', '3000')).toBe(':3000')
  })
  it('throws for non-numeric port', () => {
    expect(() => normalizeDevPort('http://', 'abc')).toThrow(
      'DEV_PORT must be a number'
    )
  })
  it('returns empty string for empty port', () => {
    expect(normalizeDevPort('http://', '')).toBe('')
  })
})

describe('normalizeBranch', () => {
  it('lowercases and replaces invalid chars', () => {
    expect(normalizeBranch('FeaTURE/Br@nch_42')).toBe('feature-br-nch-42')
  })
  it('handles empty string', () => {
    expect(normalizeBranch('')).toBe('')
  })
  it('replaces all invalid chars with dash', () => {
    expect(normalizeBranch('@@@')).toBe('---')
  })
  it('preserves valid chars', () => {
    expect(normalizeBranch('abc-123')).toBe('abc-123')
  })
})
