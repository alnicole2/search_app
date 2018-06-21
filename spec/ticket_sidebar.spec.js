/* eslint-env jest */
import TicketSidebar from '../src/javascript/locations/ticket_sidebar'
var mockSearch
jest.mock('../src/javascript/modules/search', () => {
  mockSearch = class {}
  return mockSearch
})

describe('TicketSidebar', () => {
  const app = new TicketSidebar({}, {})

  it('constructs a new instance from Search class', () => {
    expect(app instanceof mockSearch).toBe(true)
  })
})
