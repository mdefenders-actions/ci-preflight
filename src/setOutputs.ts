import * as core from '@actions/core'
import * as github from '@actions/github'

export async function setOutputs(): Promise<Record<string, string | number>> {
  const result: Record<string, string | number> = {}
  const environment = core.getInput('environment', { required: true })
  const { owner, repo } = github.context.repo
  const gitopsRepoSuffix = core.getInput('gitops-repo-suffix', {
    required: true
  })
  const gitopsRepo =
    core.getInput('gitops-repo') || `${owner}/${repo}${gitopsRepoSuffix}`
  const appName = core.getInput('app-name') || repo
  const domain = core.getInput('domain', { required: true })
  const devSchema = core.getInput('dev-url-schema')
  const devPort = normalizeDevPort(devSchema, core.getInput('dev-port'))
  const branch = getBranchName()
  const repoName = gitopsRepo.split('/').pop() || repo + gitopsRepoSuffix
  const base = repoName
    .replace(new RegExp(`${gitopsRepoSuffix}$`), '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
  const normBranch = normalizeBranch(branch)

  let namespace = `${base}-${normBranch}`
  let subDomain = normBranch
  let serviceUrl = `${devSchema}${appName}.${normBranch}.${domain}${devPort}`
  let localFqdn = `${appName}.${normBranch}.svc.cluster.local`
  let publicFqdn = `${appName}.${normBranch}.${domain}`

  if (environment === 'staging') {
    subDomain = 'staging'
    serviceUrl = `${devSchema}${appName}.staging.${domain}${devPort}`
    namespace = 'staging'
    localFqdn = `${appName}.staging.svc.cluster.local`
    publicFqdn = `${appName}.staging.${domain}`
  } else if (environment === 'prod') {
    subDomain = ''
    serviceUrl = `${devSchema}${appName}.${domain}${devPort}`
    namespace = 'prod'
    localFqdn = `${appName}.prod.svc.cluster.local`
    publicFqdn = `${appName}.${domain}`
  }

  const outputs = {
    'target-namespace': namespace,
    'effective-branch': branch,
    subdomain: subDomain,
    'start-time': Date.now(),
    'gitops-repo': gitopsRepo,
    'gitops-file': `${core.getInput('gitops-file-path')}/${environment}/${core.getInput('gitops-file-name')}`,
    'app-name': appName,
    'local-service-fqdn': localFqdn,
    'public-service-fqdn': publicFqdn,
    'service-url': serviceUrl
  }

  for (const [key, value] of Object.entries(outputs)) {
    core.setOutput(key, value)
    result[key] = value
  }

  return result
}

function getBranchName(): string {
  const pr = github.context.payload.pull_request
  if (pr) return pr.head.ref
  const ref = github.context.ref
  if (!ref)
    throw new Error(
      'github.context.ref is undefined. Cannot determine branch name.'
    )
  if (ref.startsWith('refs/heads/')) return ref.substring('refs/heads/'.length)
  if (ref.startsWith('refs/tags/'))
    throw new Error('Tag detected, not a branch')
  throw new Error(`Unknown ref format ${ref}`)
}

export function normalizeBranch(branch: string): string {
  return branch.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

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
