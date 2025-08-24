/**
 * Generates a Markdown table from the outputs object.
 * The table has headers "Parameter" and "Value" and lists all key-value pairs.
 * @param outputs - The outputs object containing key-value pairs
 * @returns Markdown string with the table
 */
export async function generateMarkDown(
  outputs: Record<string, string | number>
): Promise<string> {
  let markDown = `### PreFlight Check Outputs\n\n`
  markDown += '| Parameter | Value |\n|-----------|-------|\n'
  for (const [key, value] of Object.entries(outputs)) {
    markDown += `| ${key} | ${value} |\n`
  }
  return markDown
}
