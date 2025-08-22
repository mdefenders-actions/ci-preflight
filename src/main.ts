import * as core from '@actions/core'
import { setOutputs } from './setOutputs.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')


    // Log the current timestamp, wait, then log the new timestamp
    await setOutputs()
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(`Action failed with error: ${error.message}`)
      core.setFailed(error.message)
    } else {
      core.error('Action failed with an unknown error')
      core.setFailed('Unknown error occurred')
    }
  } finally {
    core.setOutput('report', '')
  }
}
