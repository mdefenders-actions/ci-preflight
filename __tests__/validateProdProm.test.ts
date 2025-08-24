import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as fs from '../__fixtures__/fs.js'
import { exec } from '../__fixtures__/exec.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => ({ exec }))
jest.unstable_mockModule('fs/promises', () => fs)

const { validateProdProm } = await import('../src/validateProdProm.js')

describe('validateProdProm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('succeeds with valid version and tag', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockResolvedValueOnce('{"version":"1.2.3"}')
    exec.mockResolvedValueOnce(0) // config name
    exec.mockResolvedValueOnce(0) // config email
    exec.mockResolvedValueOnce(0) // pull
    // Simulate git tag --list output with listeners
    exec.mockImplementationOnce((cmd, args, opts) => {
      if (opts && opts.listeners && opts.listeners.stdout) {
        opts.listeners.stdout(Buffer.from('1.2.3'))
      }
      return Promise.resolve(0)
    })
    exec.mockResolvedValueOnce(0) // checkout
    fs.readFile.mockResolvedValueOnce('{"version":"1.2.3"}')
    await expect(validateProdProm()).resolves.toBe('1.2.3')
  })

  it('throws on invalid version format', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockResolvedValueOnce('{"version":"badver"}')
    await expect(validateProdProm()).rejects.toThrow(
      'Invalid version in version.json: must be a valid semver (e.g., 1.2.3)'
    )
  })

  it('throws if tag does not exist', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockResolvedValueOnce('{"version":"1.2.3"}')
    exec.mockResolvedValueOnce(0) // config name
    exec.mockResolvedValueOnce(0) // config email
    exec.mockResolvedValueOnce(0) // pull
    // Simulate git tag --list output with listeners (empty output)
    exec.mockImplementationOnce((cmd, args, opts) => {
      if (opts && opts.listeners && opts.listeners.stdout) {
        opts.listeners.stdout(Buffer.from(''))
      }
      return Promise.resolve(0)
    })
    await expect(validateProdProm()).rejects.toThrow(/Tag 1.2.3 does not exist/)
  })

  it('throws on version mismatch after checkout', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockResolvedValueOnce('{"version":"1.2.3"}')
    exec.mockResolvedValueOnce(0) // config name
    exec.mockResolvedValueOnce(0) // config email
    exec.mockResolvedValueOnce(0) // pull
    // Simulate git tag --list output with listeners
    exec.mockImplementationOnce((cmd, args, opts) => {
      if (opts && opts.listeners && opts.listeners.stdout) {
        opts.listeners.stdout(Buffer.from('1.2.3'))
      }
      return Promise.resolve(0)
    })
    exec.mockResolvedValueOnce(0) // checkout
    fs.readFile.mockResolvedValueOnce('{"version":"2.0.0"}')
    await expect(validateProdProm()).rejects.toThrow(/Version mismatch/)
  })

  it('propagates fs errors', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockRejectedValueOnce(new Error('FS error'))
    await expect(validateProdProm()).rejects.toThrow('FS error')
  })

  it('propagates exec errors', async () => {
    core.getInput.mockReturnValue('version.json')
    fs.readFile.mockResolvedValueOnce('{"version":"1.2.3"}')
    exec.mockRejectedValueOnce(new Error('Exec error'))
    await expect(validateProdProm()).rejects.toThrow('Exec error')
  })
})
