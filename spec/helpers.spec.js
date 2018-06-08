/* global describe, it, jest, expect */
import {resizeContainer, templatingLoop, loopingPaginatedRequest} from '../src/javascript/lib/helpers'

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

describe('loopingPaginatedRequest', () => {
  let client = {
    request: jest.fn()
  }

  it('should return 1 user', (done) => {
    client.request.mockReturnValueOnce(Promise.resolve({
      'users': [
        {
          'name': 'TT'
        }
      ],
      'next_page': ''
    }))
    loopingPaginatedRequest(client, 'fakeUrl', 'users').then((results) => {
      expect(results.length).toBe(1)
      done()
    })
  })

  it('should return 10 user', (done) => {
    client.request.mockReturnValue(Promise.resolve({
      'users': [
        {
          'name': 'TT'
        }
      ],
      'next_page': 'http://getusers.nextpage'
    }))
    loopingPaginatedRequest(client, 'fakeUrl', 'users', 10).then((results) => {
      expect(results.length).toBe(10)
      done()
    })
  })
})
