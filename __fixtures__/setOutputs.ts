import { jest } from '@jest/globals'

export const setOutputs =
  jest.fn<typeof import('../src/setOutputs.js').setOutputs>()
