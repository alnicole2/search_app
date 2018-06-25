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

export const RESULTS_12 = {
  'results': [
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/1.json',
      'id': 1,
      'subject': 'New ticket 1',
      'description': 'Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/2.json',
      'id': 2,
      'subject': 'New ticket 2 text',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/3.json',
      'id': 3,
      'subject': 'New ticket 3 text',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/4.json',
      'id': 4,
      'subject': 'New ticket 4 text',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/5.json',
      'id': 5,
      'subject': 'New ticket 5 text',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    },
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/6.json',
      'id': 6,
      'subject': 'New ticket 6 text',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    },
    {
      'html_url': 'https://z3n4693.zendesk.com/api/v2/article/7.json',
      'name': 'New article 7 text',
      'result_type': 'article'
    },
    {
      'id': 8,
      'name': 'New user 8 text',
      'result_type': 'user'
    },
    {
      'id': 9,
      'name': 'New organization 9 text',
      'result_type': 'organization'
    },
    {
      'name': 'New group 10 text',
      'result_type': 'group'
    },
    {
      'id': 11,
      'title': 'New topic 11 text',
      'result_type': 'topic'
    },
    {
      'id': 12,
      'result_type': 'unknow'
    }
  ],
  'next_page': '#link',
  'previous_page': '#link',
  'count': 12
}

export const RESULTS_1 = {
  'results': [
    {
      'url': 'https://z3n4693.zendesk.com/api/v2/tickets/1.json',
      'id': 1,
      'subject': 'New ticket 1',
      'description': 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      'result_type': 'ticket'
    }
  ],
  'next_page': '',
  'previous_page': '',
  'count': 1
}

export const RESULTS_0 = {
  'results': [],
  'next_page': '',
  'previous_page': '',
  'count': 0
}

export const RESULTS_200 = {
  'results': new Array(200).fill({}),
  'next_page': '#link',
  'previous_page': '#link',
  'count': 200
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
        'ticket.subject': 'New Ticket Ticket'
      })
    }
    /* istanbul ignore next */
    if (Array.isArray(prop)) {
      return Promise.resolve({
        'ticket.customField:custom_field_1': 'cf_suggestion_1',
        'ticket.customField:custom_field_2': '',
        'ticket.customField:custom_field_3': 'cf_suggestion_1'
      })
    }
  },
  request: jest.fn(),
  invoke: jest.fn()
}

export const APPDATA_WITH_CF = {
  metadata: {
    settings: {
      custom_fields: '1 2 3',
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
