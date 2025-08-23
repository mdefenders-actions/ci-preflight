# CI Preflight GitHub Action

> Collect and normalize deployment metadata for your CI/CD pipeline. Outputs key
> information for use in subsequent workflow steps and generates a Markdown
> summary report.

[![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

## Features

- Collects environment and repository metadata
- Normalizes application and service information
- Outputs all data for use in later workflow steps
- Generates a Markdown summary for workflow visualization
- Robust error handling and logging

## Installation

To use this action in your workflow, add the following step:

```yaml
- name: CI Preflight
  uses: <owner>/<repository>@v1 # Replace with your repository and version/tag
  with:
    environment: 'dev'
    gitops-repo-suffix: '-gitops'
```

## Inputs

| Name                 | Description                          | Required | Default   |
| -------------------- | ------------------------------------ | -------- | --------- |
| `environment`        | CI/CD environment                    | Yes      | `dev`     |
| `gitops-repo-suffix` | Suffix for GitOps repository name    | No       | `-gitops` |

## Outputs

| Name                  | Description                          |
| --------------------- | ------------------------------------ |
| `start-time`          | Workflow start time (ms since epoch) |
| `gitops-repo`         | The GitOps repository name           |
| `gitops-file`         | The GitOps file path                 |
| `app-name`            | The application name                 |
| `target-namespace`    | The target Kubernetes namespace      |
| `public-service-fqdn` | The public service FQDN              |
| `local-service-fqdn`  | The local service FQDN               |
| `service-url`         | The service URL                      |
| `result`              | JSON string of all outputs           |

## Example Workflow

```yaml
name: CI Pipeline
on:
  push:
    branches: [main]

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: CI Preflight
        uses: <owner>/<repository>@v1
        with:
          environment: 'dev'
          gitops-repo-suffix: '-gitops'
      - name: Print outputs
        run: echo "App name is ${{ steps.ci-preflight.outputs.app-name }}"
```

## Development

### Setup

Install dependencies:

```bash
npm install
```

### Testing

Run unit tests:

```bash
npm run test
```

### Bundling

Transpile TypeScript and bundle for distribution:

```bash
npm run bundle
```

## Contributing

- Follow TypeScript and GitHub Actions best practices
- Add and update unit tests for new features
- Document changes in this readme

## License

See [LICENSE](./LICENSE) for details.
