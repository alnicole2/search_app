/**
 *  Search module
 **/

import I18n from '../lib/i18n'
import {resizeContainer, loopingPaginatedRequest} from '../lib/helpers'
import getResultsTemplate from '../../templates/results'
import getSearchTemplate from '../../templates/search'
import getAssigneesTemplate from '../../templates/assignees'
import DropdownWithTags from '../lib/dropdown_with_tags'

const PER_PAGE = 10
const MAX_HEIGHT = 1000
const MAX_PAGE = 100

class Search {
  constructor (client, appData, config) {
    this._client = client
    this._appData = appData
    this._config = config
    this._apis = {
      brands: `/api/v2/brands.json`,
      users: `/api/v2/group_memberships/assignable.json?include=users`,
      search: `/api/v2/search.json?per_page=${PER_PAGE}&query=`
    }
    this._states = {
      showAdvancedOptions: false,
      showTicketFields: false,
      hasMultiplebBrands: false,
      results: [],
      isLoading: false
    }
    this._initializePromise = this._init()
  }

  /**
   * Initialization App
   */
  async _init () {
    // retrieve initialization data
    const currentUser = (await this._client.get('currentUser')).currentUser
    I18n.loadTranslations(currentUser.locale)
    this._ticket = (await this._client.get('ticket')).ticket
    Object.assign(
      this._states,
      {
        brands: await this._getBrands().catch(this._handleRequestFail.bind(this, '.loader')),
        suggestions: await this._getSearchSuggestions().catch(this._handleRequestFail.bind(this, '.loader')),
        ticketStatusOptions: [
          {
            label: I18n.t('search.value.new'),
            value: 'new',
            isSelected: true
          },
          {
            label: I18n.t('search.value.open'),
            value: 'open',
            isSelected: false
          },
          {
            label: I18n.t('search.value.pending'),
            value: 'pending',
            isSelected: false
          },
          {
            label: I18n.t('search.value.onhold'),
            value: 'hold',
            isSelected: false
          },
          {
            label: I18n.t('search.value.solved'),
            value: 'solved',
            isSelected: false
          },
          {
            label: I18n.t('search.value.closed'),
            value: 'closed',
            isSelected: false
          }
        ]
      }
    )
    if (this._states.brands && this._states.suggestions) {
      await this._render('.loader', getSearchTemplate)
      // render application markup
      this._appContainer = document.querySelector('.search-app')
      this._keywordField = document.querySelector('.search-box')
      this._advancedToggle = document.querySelector('#advanced-field-toggle')
      this._filterField = document.querySelector('#type')
      this._ticketStatusObj = new DropdownWithTags(
        this._states.ticketStatusOptions,
        document.querySelector('#ticket-status'),
        'Ticket Status'
      )
      // bind events
      this._appContainer.addEventListener('click', this._clickHandlerDispatch.bind(this))
      this._keywordField.addEventListener('keydown', this._handleKeydown.bind(this))
      this._advancedToggle.addEventListener('change', this._handleAdvancedFieldsToggle.bind(this))
      this._filterField.addEventListener('change', this._handleFilterChange.bind(this))
    }
  }

  /**
   * Get available brands list
   * @return {Promise} Resolved to a brands array
   */
  async _getBrands () {
    const brands = await loopingPaginatedRequest(this._client, this._apis.brands, 'brands', MAX_PAGE)
    if (brands.length > 1) Object.assign(this._states, {hasMultiplebBrands: true})
    const currentTicketBrand = this._ticket.brand
    return brands.map((brand) => {
      return {
        value: brand.id,
        label: brand.name,
        selected: brand.id === currentTicketBrand.id
      }
    })
  }

  /**
   * Get keyword suggestions list from custom fields and ticket subject
   * @return {Promise} Resolved to a suggestions array
   */
  async _getSearchSuggestions () {
    const searchSuggestions = new Set()
    const customFieldIDs = this._appData.metadata.settings.custom_fields && this._appData.metadata.settings.custom_fields.match(/\d+/g)
    const isRelatedTicketsConfigOn = this._appData.metadata.settings.related_tickets
    const ticketSubject = (await this._client.get('ticket.subject'))['ticket.subject']
    // custom field suggestions
    if (customFieldIDs) {
      const customFieldNames = customFieldIDs.map((id) => {
        return `ticket.customField:custom_field_${id}`
      })
      await this._client.get(customFieldNames).then((values) => {
        customFieldNames.forEach((name) => {
          values[name] && searchSuggestions.add(values[name])
        })
      })
    }
    // ticket subject suggestions
    if (isRelatedTicketsConfigOn && ticketSubject) {
      // strip punctuation and extra spaces, split by spaces
      const words = ticketSubject.toLowerCase().replace(/[.,-/#!$?%^&*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ').split(' ')
      const exclusions = I18n.t('stopwords.exclusions').split(',')
      words.forEach((w) => {
        !exclusions.includes(w) && searchSuggestions.add(w)
      })
    }
    return Array.from(searchSuggestions)
  }

  /**
   * Get assignees list
   * !! To be confirm, how to get the full list in one shot
   * @return {Promise} Resolved to an assignees array
   */
  async _getAssignees () {
    return loopingPaginatedRequest(this._client, this._apis.users, 'users', MAX_PAGE)
  }

  /**
   * Handling click events delegation
   * @param {Event} event
   */
  _clickHandlerDispatch (event) {
    const target = event.target
    if (target.parentNode.id === 'search-submit') this._doTheSearch(event)
    else if (target.classList.contains('suggestion')) this._handleSuggestionClick(event)
    else if (target.classList.contains('page-link') && target.dataset.url) this._doTheSearch(event, target.dataset.url)
    else if (target.classList.contains('ticket-link')) this._handleResultLinkClick(event)
  }

  /**
   * Keyword field keydown handler, search when press enter key
   * @param {Event} event
   */
  _handleKeydown (event) {
    if (event.which === 13) this._doTheSearch(event)
  }

  /**
   * Advanced toggle change handler
   * @param {Event} event
   */
  async _handleAdvancedFieldsToggle (event) {
    if (!this._states.assignees) {
      Object.assign(
        this._states,
        {
          assignees: await this._getAssignees().catch(this._handleRequestFail.bind(this, '.loader'))
        }
      )
      await this._render('#assignee', getAssigneesTemplate)
    }
    Object.assign(this._states, {showAdvancedOptions: event.target.checked})
    this._appContainer.querySelector('.advanced-options-wrapper').classList.toggle('u-display-block')
    resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Filter field change handler
   * @param {Event} event
   */
  _handleFilterChange (event) {
    const isTicketSelected = event.target.value === 'ticket'
    Object.assign(this._states, {showTicketFields: isTicketSelected})
    Array.prototype.forEach.call(this._appContainer.querySelectorAll('.ticket-only'), (field) => {
      field.classList[isTicketSelected ? 'add' : 'remove']('u-display-block')
    })
    resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Fire the search request
   * @param {Event} event
   * @param {String} url if url is passed in(e.g. prev/next links), use it instead of compsing endpoint from form.
   */
  async _doTheSearch (event, url) {
    event.preventDefault()
    if (this._keywordField.value) {
      Object.assign(this._states, {isLoading: true})
      await this._render('.results-wrapper', getResultsTemplate)
      const results = await this._client.request({
        url: url || this._apis.search + encodeURIComponent(this._getSearchParams()),
        cors: true
      }).catch(this._handleRequestFail.bind(this, '.results-wrapper'))
      results && this._handleSearchResults(results)
    }
  }

  /**
   * Suggestion tag click handler
   * @param {Event} event
   */
  _handleSuggestionClick (event) {
    this._keywordField.value = `${this._keywordField.value} ${event.target.textContent}`.trim()
    this._doTheSearch(event)
  }

  /**
   * Result link click handler
   * @param {Event} event
   */
  _handleResultLinkClick (event) {
    event.preventDefault()
    this._client.invoke('routeTo', 'ticket', event.target.dataset.id)
  }

  /**
   * Retrieve the search params from form fields
   * @return {String} concatenated search terms string
   */
  _getSearchParams () {
    const params = []
    const $search = this._appContainer.querySelector('.search')
    const searchType = $search.querySelector('#type').value
    const searchTerm = this._keywordField.value
    if (searchType !== 'all') {
      params.push(`type:${searchType}`)
    }
    if (this._states.showAdvancedOptions) {
      // Status
      const filter = $search.querySelector('#filter').value
      const condition = $search.querySelector('#condition').value
      const value = $search.querySelector('#value').value
      if (this._states.showTicketFields && filter && condition && value) params.push([filter, condition, value].join(''))
      // Created
      const range = $search.querySelector('#range').value
      const from = $search.querySelector('#from').value
      const to = $search.querySelector('#to').value
      if (range && from) params.push(`${range}>${from}`)
      if (range && to) params.push(`${range}<${to}`)
      // Assignee
      const assignee = $search.querySelector('#assignee').value
      if (this._states.showTicketFields && assignee) params.push(`assignee:"${assignee}"`)
      // Brand
      const brand = $search.querySelector('#brand-filter')
      if (this._states.hasMultiplebBrands) brand.value && params.push(`brand_id:"${brand.value}"`)
    }
    if (params.length) return `${searchTerm} ${params.join(' ')}`
    return searchTerm
  }

  /**
   * Format and render search results
   * @param {Object} data response of the search request
   */
  _handleSearchResults (data) {
    Object.assign(
      this._states,
      {
        results: data.results.filter((result, index) => {
          // Format result description,
          // !! Discard current open ticket from the results list, this causes an existing bug when results are paginated
          if (result.result_type === 'ticket') {
            if (result.id === this._ticket.id) return false
            if (result.description.length > 140) {
              result.description = result.description.substr(0, 140).concat('...')
            }
          }
          return true
        }),
        pagination: {
          is_paged: !!(data.next_page || data.previous_page),
          previous_page: data.previous_page,
          next_page: data.next_page,
          count: I18n.t('search.results', { count: data.count })
        },
        isLoading: false,
        isError: false
      }
    )
    this._render('.results-wrapper', getResultsTemplate)
  }

  /**
   * Format and render error message
   * @param {Object} data response of the search request
   */
  _handleRequestFail (container, data) {
    const response = JSON.parse(data.responseText)
    let message = ''
    if (response.error) { message = I18n.t(`global.error.${response.error}`) } else if (response.description) { message = response.description } else { message = I18n.t('global.error.message') }
    Object.assign(
      this._states,
      {
        error: {
          title: I18n.t('global.error.title'),
          message: message
        },
        isLoading: false,
        isError: true
      }
    )
    this._render(container, getResultsTemplate)
  }

  /**
   * Render template
   * @param {String} replacedNodeSelector selector of the node to be replaced
   * @param {Function} getTemplate function to generate the new Node
   * @return {Promise} will resolved after resize
   */
  _render (replacedNodeSelector, getTemplate) {
    const fragment = document.createRange().createContextualFragment(getTemplate(this._states))
    const replacedNode = document.querySelector(replacedNodeSelector)
    replacedNode.parentNode.replaceChild(fragment, replacedNode)
    return resizeContainer(this._client, MAX_HEIGHT)
  }
}

export default Search
