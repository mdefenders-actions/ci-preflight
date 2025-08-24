import * as fs from 'fs/promises'
import * as core from '@actions/core'
import { exec } from '@actions/exec'

export async function validateProdProm(): Promise<string> {
  const versionFile = core.getInput('version-file', { required: true })

  // Configure Git
  await exec('git', ['config', '--global', 'user.name', 'github-actions[bot]'])
  await exec('git', [
    'config',
    '--global',
    'user.email',
    'github-actions[bot]@users.noreply.github.com'
  ])
  await exec('git', ['pull', '--tags'])

  // Read and validate version
  const data = JSON.parse(await fs.readFile(versionFile, 'utf-8'))
  if (!/^\d+\.\d+\.\d+$/.test(data.version)) {
    throw new Error(
      `Invalid version in ${versionFile}: must be a valid semver (e.g., 1.2.3)`
    )
  }

  // Check if tag exists
  let tagExists = false
  await exec('git', ['tag', '--list', data.version], {
    listeners: {
      stdout: (output: Buffer) => {
        if (output.toString().trim() === data.version) tagExists = true
      }
    }
  })
  if (!tagExists) {
    throw new Error(`Tag ${data.version} does not exist in the repository`)
  }

  // Validate version consistency
  await exec('git', ['checkout', data.version])
  const dataFromTag = JSON.parse(await fs.readFile(versionFile, 'utf-8'))
  if (dataFromTag.version !== data.version) {
    throw new Error(
      `Version mismatch after checkout: expected ${data.version}, got ${dataFromTag.version}`
    )
  }
  return data.version
}
