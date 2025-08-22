import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * Sets outputs for the GitHub Action.
 */
export async function setOutputs(): Promise<void> {
  const environment = core.getInput('environment', {
    required: true
  })
  const { owner, repo } = github.context.repo
  const gitopsRepoSuffix = core.getInput('gitops-repo-suffix', {
    required: true
  })
  const gitopsRepo =
    process.env.GITOPS_REPO && process.env.GITOPS_REPO.trim() !== ''
      ? process.env.GITOPS_REPO
      : `${owner}/${repo}${gitopsRepoSuffix}`
  const gitopsFilePath = process.env.GITOPS_FILE_PATH || 'deploy/environments'
  const gitopsFileName = process.env.GITOPS_FILE_NAME || 'values.yaml'
  const appName = process.env.APP_NAME || repo
  const domain = process.env.DOMAIN || 'example.com'
  const devSchema = process.env.DEV_SCHEMA || 'http://'
  let devPort = process.env.DEV_PORT || '80'
  devPort = normalizeDevPort(devSchema, devPort)

  // Determine repo name and base
  const repoName = (process.env.GITOPS_REPO || '').split('/').pop() || repo
  const base = repoName
    .replace(new RegExp(`${gitopsRepoSuffix}$`), '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')

  // Normalize branch
  const branch = normalizeBranch(getBranchName())

  // Compose namespace
  const namespace = `${base}-${branch}`

  core.setOutput('target-namespace', namespace)
  core.setOutput('subdomain', branch)
  core.setOutput('start-time', Date.now())
  core.setOutput('gitops-repo', gitopsRepo)
  core.setOutput(
    'gitops-file',
    `${gitopsFilePath}/${environment}/${gitopsFileName}`
  )
  core.setOutput('app-name', appName)
  core.setOutput('local-service-fqdn', `${appName}.${branch}.svc.cluster.local`)
  core.setOutput('public-service-fqdn', `${appName}.${branch}.${domain}`)
  core.setOutput(
    'service-url',
    `${devSchema}${appName}.${branch}.${domain}${devPort}`
  )
}

/**
 * Returns the branch name from the GitHub context.
 */
function getBranchName(): string {
  const pr = github.context.payload.pull_request
  if (pr) return pr.head.ref
  const ref = github.context.ref
  if (!ref) {
    throw new Error(
      'github.context.ref is undefined. Cannot determine branch name.'
    )
  }
  if (ref.startsWith('refs/heads/')) return ref.substring('refs/heads/'.length)
  if (ref.startsWith('refs/tags/')) {
    throw new Error('Tag detected, not a branch')
  }
  throw new Error(`Unknown ref format ${ref}`)
}

/**
 * Normalizes a branch name to lowercase and replaces non [a-z0-9-] chars with '-'.
 */
export function normalizeBranch(branch: string): string {
  return branch.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/**
 * Normalizes the devPort value based on schema and port rules.
 * @param devSchema - The schema (http/https)
 * @param devPort - The port value
 * @returns Normalized port string (e.g., '', ':8080')
 * @throws Error if devPort is not a number and not empty
 */
export function normalizeDevPort(devSchema: string, devPort: string): string {
  if (
    (devSchema === 'https://' && devPort === '443') ||
    (devSchema === 'http://' && devPort === '80')
  ) {
    return ''
  } else if (/^\d+$/.test(devPort)) {
    return `:${devPort}`
  } else if (devPort) {
    throw new Error('DEV_PORT must be a number')
  } else {
    return ''
  }
}
