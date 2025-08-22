/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { setOutputs } from '../__fixtures__/setOutputs.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/setOutputs.js', () => ({ setOutputs }))

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should call setOutputs, log time, and set result output to ok', async () => {
    await run()
    expect(setOutputs).toHaveBeenCalledTimes(1)
    expect(core.debug).toHaveBeenCalledWith(
      expect.stringMatching(/\d{2}:\d{2}:\d{2}/)
    )
    expect(core.setOutput).toHaveBeenCalledWith('result', 'ok')
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('should handle errors from setOutputs and set failure output', async () => {
    const error = new Error('fail!')
    setOutputs.mockImplementationOnce(() => Promise.reject(error))
    await run()
    expect(core.error).toHaveBeenCalledWith(
      `Action failed with error: ${error.message}`
    )
    expect(core.setFailed).toHaveBeenCalledWith(error.message)
    expect(core.setOutput).toHaveBeenCalledWith('result', 'ok')
  })

  it('should handle unknown errors and set failure output', async () => {
    setOutputs.mockImplementationOnce(() => Promise.reject('unknown'))
    await run()
    expect(core.error).toHaveBeenCalledWith(
      'Action failed with an unknown error'
    )
    expect(core.setFailed).toHaveBeenCalledWith('Unknown error occurred')
    expect(core.setOutput).toHaveBeenCalledWith('result', 'ok')
  })
})
