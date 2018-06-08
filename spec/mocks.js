/* global jest */
export const BRANDS_SINGLE = {
  'brands': [
    {'id': 360000636152, 'name': 'z3n'}
  ]
}

export const BRANDS_MULTI = {
  'brands': [
    {'id': 360000636152, 'name': 'z3n'},
    {'id': 360000704351, 'name': 'z3nTestBrand1'}
  ]
}

export const ASSIGNEES = {
  'users': [
    {
      'id': 364556238952,
      'url': 'https://z3n4693.zendesk.com/api/v2/users/364556238952.json',
      'name': 'TT',
      'email': 'tt@zendesk.com'
    }
  ],
  'next_page': ''
}

export const RESULTS_MULTI_PAGE = {
  'results': [
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/4.json',
      'id': 1,
      'subject': 'New ticket 2',
      'description': 'New ticket 2 text',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/6.json',
      'id': 6,
      'subject': 'New ticket 4 text',
      'description': 'New ticket 4',
      'result_type': 'ticket'
    },
    {
      'html_url': 'https://z3n4693.zendesk.com/api/v2/tickets/6.json',
      'name': 'New article 1 text',
      'result_type': 'article'
    },
    {
      'id': 8,
      'name': 'New article 1 text',
      'result_type': 'user'
    },
    {
      'id': 9,
      'name': 'New article 1 text',
      'result_type': 'organization'
    },
    {
      'name': 'New article 1 text',
      'result_type': 'group'
    },
    {
      'id': 10,
      'title': 'New article 1 text',
      'result_type': 'topic'
    },
    {
      'id': 11,
      'result_type': 'unknow'
    }
  ],
  'next_page': 'https://z3n4693.zendesk.com/api/v2/search.json?page=3&per_page=2&query=ticket+ticket',
  'previous_page': 'https://z3n4693.zendesk.com/api/v2/search.json?page=1&per_page=2&query=ticket+ticket',
  'count': 6
}

export const RESULTS_SINGLE_PAGE = {
  'results': [
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/6.json',
      'id': 8,
      'subject': 'New article 1 text',
      'description': 'New article',
      'result_type': 'article'
    }
  ],
  'next_page': '',
  'previous_page': '',
  'count': 1
}

export const RESULTS_EMPTY = {
  'results': [],
  'next_page': '',
  'previous_page': '',
  'count': 0
}

export const RESULTS_FIRST_PAGE = {
  'results': [
    {}, {}
  ],
  'next_page': 'https://z3n4693.zendesk.com/api/v2/search.json?page=3&per_page=2&query=ticket+ticke',
  'previous_page': '',
  'count': 2
}

export const RESULTS_LAST_PAGE = {
  'results': [
    {}, {}
  ],
  'next_page': '',
  'previous_page': 'https://z3n4693.zendesk.com/api/v2/search.json?page=3&per_page=2&query=ticket+ticke',
  'count': 2
}

export const CLIENT = {
  _origin: 'zendesk.com',
  get: (prop) => {
    switch (prop) {
      case 'currentUser': return Promise.resolve({
        'currentUser': {'locale': 'en'}
      })
      case 'ticket': return Promise.resolve({
        'ticket': {
          'id': 1,
          'brand': {
            'id': 360000636152,
            'name': 'z3n'
          }
        }
      })
      case 'ticket.subject': return Promise.resolve({
        'ticket.subject': 'New Ticket'
      })
      case 'ticket.customField:custom_field_1': return Promise.resolve({
        'ticket.customField:custom_field_1': 'cf_suggestion_1'
      })
      case 'ticket.customField:custom_field_2': return Promise.resolve({})
    }
  },
  request: jest.fn(),
  invoke: jest.fn()
}

export const APPDATA_WITH_CF = {
  metadata: {
    settings: {
      custom_fields: '1 2',
      related_tickets: true
    }
  }
}
export const APPDATA_WITHOUT_CF = {
  metadata: {
    settings: {
      custom_fields: '',
      related_tickets: false
    }
  }
}
export const CONFIG = {}

// jsdom createRange polyfill
export const createRangePolyfill = () => {
  document.createRange = () => ({
    createContextualFragment: (templateString) => {
      let template = document.createElement('template')
      template.innerHTML = templateString
      return template.content
    }
  })
}
