/* global describe, it, jest, expect */
import {resizeContainer, templatingLoop} from '../src/javascript/lib/helpers'

const client = {
  invoke: jest.fn()
}
const dataSet = [1, 2, 3]
const getTemplate = item => `${item}-`

describe('resizeContainer', () => {
  resizeContainer(client)
  it('client.invoke has been called', () => {
    expect(client.invoke).toHaveBeenCalled()
  })
})

describe('templatingLoop', () => {
  it('generate html with data set and template function', () => {
    expect(templatingLoop(dataSet, getTemplate, '-')).toBe('-1-2-3-')
  })

  it('return empty string if data set and initial value is empty', () => {
    expect(templatingLoop([], getTemplate)).toBe('')
  })
})
