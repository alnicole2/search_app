/**
 *  Search module
 **/

import I18n from '../lib/i18n'
import {resizeContainer, loopingPaginatedRequest} from '../lib/helpers'
import getResultsTemplate from '../../templates/results'
import getSearchTemplate from '../../templates/search'
import getAssigneesTemplate from '../../templates/assignees'
import DropdownWithTags from '../lib/dropdown_with_tags'
import closest from 'closest'

const PER_PAGE = 5
const MAX_HEIGHT = 1000
const MAX_PAGE = 100
const API = {
  brands: `/api/v2/brands.json`,
  users: `/api/v2/group_memberships/assignable.json?include=users`,
  search: `/api/v2/search.json?per_page=${PER_PAGE}&query=`
}

class Search {
  constructor (client, appData, config) {
    this._client = client
    this._appData = appData
    this._config = config
    this._states = {
      showAdvancedOptions: false,
      showTicketFields: false,
      hasMultiplebBrands: false,
      results: [],
      currentPage: 1
    }
    this._initializePromise = this._init()
  }

  /**
   * Initialize App
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
          {label: I18n.t('search.value.new'), value: 'new', isSelected: false},
          {label: I18n.t('search.value.open'), value: 'open', isSelected: false},
          {label: I18n.t('search.value.pending'), value: 'pending', isSelected: false},
          {label: I18n.t('search.value.onhold'), value: 'hold', isSelected: false},
          {label: I18n.t('search.value.solved'), value: 'solved', isSelected: false},
          {label: I18n.t('search.value.closed'), value: 'closed', isSelected: false}
        ]
      }
    )
    if (this._states.brands && this._states.suggestions) {
      // render application markup
      await this._render('.loader', getSearchTemplate)
      this.$appContainer = document.querySelector('.search-app')
      this.$searchForm = this.$appContainer.querySelector('.search')
      this.$searchDateRange = this.$searchForm.querySelector('.date-range')
      this.$searchAdvancedOptions = this.$searchForm.querySelector('.advanced-options-wrapper')
      this.$searchTicketOnlySections = this.$searchForm.querySelectorAll('.ticket-only')
      this.$keywordField = this.$searchForm.elements['keyword']
      this.$searchTypeDropdown = this.$searchForm.elements['type']
      this.$searchButton = this.$searchForm.elements['search-submit']
      this.$searchDateRangeDropdown = this.$searchForm.elements['range']
      this.$searchDateRangeFrom = this.$searchForm.elements['from']
      this.$searchDateRangeTo = this.$searchForm.elements['to']
      this.$searchAdvancedOptionsToggle = this.$searchForm.elements['advanced-field-toggle']
      this.$searchBrandFilter = this.$searchForm.elements['brand-filter']

      this._ticketStatusObj = new DropdownWithTags(
        this._states.ticketStatusOptions,
        this.$searchForm.querySelector('#ticket-status'),
        I18n.t('search.filter.ticket_status')
      )
      // events binding
      this.$appContainer.addEventListener('click', this._clickHandlerDispatch.bind(this))
      this.$searchForm.addEventListener('submit', this._doTheSearch.bind(this))
      this.$searchTypeDropdown.addEventListener('change', this._handleFilterChange.bind(this))
      this.$searchDateRangeDropdown.addEventListener('change', this._handleDateRangeChange.bind(this))
      this.$searchAdvancedOptionsToggle.addEventListener('change', this._handleAdvancedFieldsToggle.bind(this))
      this.$searchDateRangeFrom.addEventListener('invalid', this._showInvalidDateError.bind(this))
      this.$searchDateRangeTo.addEventListener('invalid', this._showInvalidDateError.bind(this))
    }
  }

  /**
   * Get available brands list
   * @return {Promise} Resolved to a brands array
   */
  async _getBrands () {
    const brands = await loopingPaginatedRequest(this._client, API.brands, 'brands', MAX_PAGE)
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
   * @return {Promise} Resolved to an assignees array
   */
  async _getAssignees () {
    return loopingPaginatedRequest(this._client, API.users, 'users', MAX_PAGE)
  }

  /**
   * Handling click events delegation
   * @param {Event} event
   */
  _clickHandlerDispatch (event) {
    const target = event.target
    if (closest(target, '.suggestion', true)) {
      this._handleSuggestionClick(event)
    }
    else if (closest(target, '.page-link', true)) {
      const closestPageLink = closest(target, '.page-link', true)
      const pageIndex = closestPageLink.dataset.index
      if (pageIndex) {
        this._doTheSearch(event, pageIndex)
      }
    }
    // add an extra property dispatchTarget to click event to store the target element,
    // click event may be triggered by child elements of our target element
    else if (closest(target, '.ticket-link', true)) {
      const closestTicketLink = closest(target, '.ticket-link', true)
      event.dispatchTarget = closestTicketLink
      this._handleResultLinkClick(event)
    }
  }

  /**
   * Advanced toggle change handler
   * @param {Event} event
   */
  async _handleAdvancedFieldsToggle (event) {
    if (!this._states.assignees) {
      this._showLoadingButton()
      Object.assign(
        this._states,
        {
          assignees: await this._getAssignees().catch(this._handleRequestFail.bind(this, '.loader'))
        }
      )
      await this._render('#assignee', getAssigneesTemplate)
      this._hideLoadingButton()
    }
    Object.assign(this._states, {showAdvancedOptions: event.target.checked})
    if (!event.target.checked) this._resetDateFields()
    this.$searchAdvancedOptions.classList.toggle('u-display-block')
    return resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Filter field change handler
   * @param {Event} event
   */
  async _handleFilterChange (event) {
    const isTicketSelected = event.target.value === 'ticket'
    Object.assign(this._states, {showTicketFields: isTicketSelected})
    Array.prototype.forEach.call(this.$searchTicketOnlySections, (field) => {
      field.classList[isTicketSelected ? 'add' : 'remove']('u-display-block')
    })
    return resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Date Range change handler
   * @param {Event} event
   */
  async _handleDateRangeChange (event) {
    if (event.target.value) {
      this.$searchDateRange.classList.add('show-fields')
    } else {
      this.$searchDateRange.classList.remove('show-fields')
      this._resetDateFields()
    }
    return this._hideInvalidDateError()
  }

  /**
   * Fire the search request
   * @param {Event} event
   * @param {String} pageIndex index of the requested page
   */
  async _doTheSearch (event, pageIndex = 1) {
    event.preventDefault()
    if (this.$searchForm.checkValidity()) {
      this._hideInvalidDateError()
      this._showLoadingButton()
      const results = await this._client.request({
        url: `${API.search + encodeURIComponent(this._getSearchParams())}&page=${pageIndex}`,
        cors: true
      }).catch(this._handleRequestFail.bind(this, '.results-wrapper'))
      if (results) {
        Object.assign(this._states, {currentPage: +pageIndex || 1})
        this._handleSearchResults(results)
      }
    }
  }

  /**
   * Suggestion tag click handler
   * @param {Event} event
   */
  _handleSuggestionClick (event) {
    this.$keywordField.value = event.target.textContent
    this._doTheSearch(event)
  }

  /**
   * Result link click handler
   * @param {Event} event
   */
  _handleResultLinkClick (event) {
    event.preventDefault()
    this._client.invoke('routeTo', 'ticket', event.dispatchTarget.dataset.id)
  }

  /**
   * Retrieve the search params from form fields
   * @return {String} concatenated search terms string
   */
  _getSearchParams () {
    const params = []
    const searchType = this.$searchTypeDropdown.value
    const searchTerm = this.$keywordField.value
    if (searchType !== 'all') {
      params.push(`type:${searchType}`)
    }
    if (this._states.showAdvancedOptions) {
      // Status
      if (this._states.showTicketFields) {
        this._ticketStatusObj.selectedValues.forEach((status) => {
          params.push(`status:${status}`)
        })
      }
      // Created
      const range = this.$searchDateRangeDropdown.value
      const from = this.$searchDateRangeFrom.value
      const to = this.$searchDateRangeTo.value
      if (range && from) params.push(`${range}>${from}`)
      if (range && to) params.push(`${range}<${to}`)
      // Assignee
      const assignee = this.$searchForm.elements['assignee'].value
      if (this._states.showTicketFields && assignee) params.push(`assignee:"${assignee}"`)
      // Brand
      if (this._states.hasMultiplebBrands && this.$searchBrandFilter.value) params.push(`brand_id:"${this.$searchBrandFilter.value}"`)
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
          if (result.result_type === 'ticket' && result.description.length > 140) {
            result.description = result.description.substr(0, 140).concat('...')
          }
          return true
        }),
        pagination: {
          hasMultiplePages: !!(data.next_page || data.previous_page),
          page_count: Math.ceil(data.count / PER_PAGE),
          count: I18n.t(this._getResultsCountKey(data.count), { count: data.count })
        },
        isError: false
      }
    )
    this._hideLoadingButton()
    this._render('.results-wrapper', getResultsTemplate)
  }

  /**
   * Get the translation key according to the number of search results
   * @param {Number} count Number of the search results
   */
  _getResultsCountKey (count) {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('count param should be a positive integer')
    }
    let key
    switch (count) {
      case 0: key = 'zero'; break
      case 1: key = 'one'; break
      default: key = 'other'
    }
    return `search.results_count.${key}`
  }

  /**
   * Format and render error message
   * @param {Object} data response of the search request
   */
  _handleRequestFail (container, data) {
    const response = JSON.parse(data.responseText)
    let message = ''
    if (response.error) {
      message = I18n.t(`global.error.${response.error}`)
    } else if (response.description) {
      message = response.description
    } else {
      message = I18n.t('global.error.message')
    }
    Object.assign(
      this._states,
      {
        error: {
          title: I18n.t('global.error.title'),
          message: message
        },
        isError: true
      }
    )
    this.$searchButton && this._hideLoadingButton()
    this._render(container, getResultsTemplate)
  }

  /**
   * Reset Date fields
   */
  _resetDateFields () {
    this.$searchDateRangeFrom.value = ''
    this.$searchDateRangeTo.value = ''
    this._hideInvalidDateError()
  }

  /**
   * Show error message when date field value is invalid
   * !! Temporary skip integration testing for this because form constraint validation is not well supported in jsdom as for now
   * https://github.com/jsdom/jsdom/issues/544
   * @return {Promise} will resolved after resize
   */
  _showInvalidDateError (event) {
    this.$searchDateRange.classList.add('show-error')
    return resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Hide error message when date field value is valid
   * @return {Promise} will resolved after resize
   */
  _hideInvalidDateError () {
    this.$searchDateRange.classList.remove('show-error')
    return resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Set search button to be loading status
   */
  _showLoadingButton () {
    this.$searchButton.classList.add('is-loading')
  }

  /**
   * Reset search button to be normal status
   */
  _hideLoadingButton () {
    this.$searchButton.classList.remove('is-loading')
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
