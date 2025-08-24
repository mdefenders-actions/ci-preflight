import { generateMarkDown } from '../src/markDown.js'
import * as core from '../__fixtures__/core.js'

describe('generateMarkDown', () => {
  beforeEach(() => {
    core.getInput.mockClear()
    core.getInput.mockImplementation((name: string) => {
      if (name === 'reportTitle') return 'PreFlight Check Outputs'
      return ''
    })
  })

  it('generates a markdown table with all outputs', async () => {
    const outputs = {
      'target-namespace': 'repo-feature-actions-test',
      subdomain: 'feature-actions-test',
      'start-time': 1755932653127,
      'gitops-repo': 'Owner/Repo-gitops',
      'gitops-file': 'deploy/environments/dev/values.yaml',
      'app-name': 'Repo',
      'local-service-fqdn': 'Repo.feature-actions-test.svc.cluster.local',
      'public-service-fqdn': 'Repo.feature-actions-test.example.com',
      'service-url': 'http://Repo.feature-actions-test.example.com'
    }
    const expected =
      '### PreFlight Check Outputs\n\n' +
      '| Parameter | Value |\n' +
      '|-----------|-------|\n' +
      '| target-namespace | repo-feature-actions-test |\n' +
      '| subdomain | feature-actions-test |\n' +
      '| start-time | 1755932653127 |\n' +
      '| gitops-repo | Owner/Repo-gitops |\n' +
      '| gitops-file | deploy/environments/dev/values.yaml |\n' +
      '| app-name | Repo |\n' +
      '| local-service-fqdn | Repo.feature-actions-test.svc.cluster.local |\n' +
      '| public-service-fqdn | Repo.feature-actions-test.example.com |\n' +
      '| service-url | http://Repo.feature-actions-test.example.com |\n'
    const result = await generateMarkDown(outputs)
    expect(result).toBe(expected)
  })

  it('handles empty outputs', async () => {
    const outputs = {}
    const expected =
      '### PreFlight Check Outputs\n\n' +
      '| Parameter | Value |\n' +
      '|-----------|-------|\n'
    const result = await generateMarkDown(outputs)
    expect(result).toBe(expected)
  })

  it('escapes pipe characters in values', async () => {
    const outputs = {
      foo: 'bar|baz',
      hello: 'world'
    }
    const expected =
      '### PreFlight Check Outputs\n\n' +
      '| Parameter | Value |\n' +
      '|-----------|-------|\n' +
      '| foo | bar|baz |\n' +
      '| hello | world |\n'
    const result = await generateMarkDown(outputs)
    expect(result).toBe(expected)
  })
})
