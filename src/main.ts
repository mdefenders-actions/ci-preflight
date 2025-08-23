import * as core from '@actions/core'
import { generateMarkDown } from './markDown.js'
import { setOutputs } from './setOutputs.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  let outputs = {}
  try {
    // Log the current timestamp, wait, then log the new timestamp
    outputs = await setOutputs()
    // Set outputs for other workflow steps to use
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(`Action failed with error: ${error.message}`)
      core.setFailed(error.message)
    } else {
      core.error('Action failed with an unknown error')
      core.setFailed('Unknown error occurred')
    }
  } finally {
    const markDownReport = await generateMarkDown(outputs)
    core.setOutput('result', JSON.stringify(outputs))
    await core.summary.addRaw(markDownReport, true).write()
  }
}
