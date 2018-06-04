import Search from '../modules/search'
// new ticket sidebar specific configs
const configs = {}

export default class extends Search {
  constructor (client, data) {
    super(client, data, configs)
  }
}
