import Search from '../modules/search'
// ticket sidebar specific configs
const configs = {
  // requiredProperties: ['ticket.id', 'ticket.subject']
}

export default class extends Search {
  constructor (client, data) {
    super(client, data, configs)
  }
}
