/* global describe, it, jest, expect */
import NewTicketSidebar from '../src/javascript/locations/new_ticket_sidebar'
var mockSearch
jest.mock('../src/javascript/modules/search', () => {
  mockSearch = class {}
  return mockSearch
})

describe('NewTicketSidebar', () => {
  const app = new NewTicketSidebar({}, {})

  it('constructs a new instance from Search class', () => {
    expect(app instanceof mockSearch).toBe(true)
  })
})
