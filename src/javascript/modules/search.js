/**
 *  Search module
 **/

import Storage from '../lib/storage';
import I18n from '../lib/i18n';
import {resizeContainer} from '../lib/helpers';
import getErrorTemplate from '../../templates/error';
import getResultsTemplate from '../../templates/results';
import getSearchTemplate from '../../templates/search';

const PER_PAGE = 2,
      MAX_HEIGHT = 1000;

class Search{
  constructor(client, appData, config) {
    console.log(client, appData);
    this._client = client;
    this._appData = appData;
    this._config = config;
    this._apis = {
      brands: `${this._client._origin}/api/v2/brands.json`,
      users: `${this._client._origin}/api/v2/group_memberships/assignable.json?include=users`,
      search: `${this._client._origin}/api/v2/search.json?per_page=${PER_PAGE}&query=`
    }
    this._states = {
      showAdvancedOptions: false,
      hasMultiplebBrands: false
    };
    // this._storage = new Storage(this._metadata.installationId, true);
    this._init();
  }

  async _init(){
    const currentUser = (await this._client.get('currentUser')).currentUser;
    I18n.loadTranslations(currentUser.locale);
    this._ticket = (await this._client.get('ticket')).ticket;
    Object.assign(
      this._states,
      {
        brands: await this._getBrands(),
        suggestions: await this._loadSearchSuggestions(),
        assignees: await this._populateAssignees()
      }
    )
    const searchFragment = document.createRange().createContextualFragment(getSearchTemplate(this._states));
    this._appContainer = searchFragment.querySelector('.search-app');
    this._keywordField = searchFragment.querySelector('.search-box');
    this._resultsContainer = searchFragment.querySelector('.results-wrapper');
    this._appContainer.addEventListener('click', this._eventHandlerDispatch.bind(this));
    this._keywordField.addEventListener('keydown', this._handleKeydown.bind(this));
    this._appContainer.querySelector('#advanced-field-toggle').addEventListener('change', this._handleAdvancedFieldsToggle.bind(this));
    document.querySelector('[data-main]').replaceChild(searchFragment, document.querySelector('.loader'));
    resizeContainer(this._client, MAX_HEIGHT);
  }

  _eventHandlerDispatch(event){
    const target = event.target;
    if(target.parentNode.getAttribute('id') === 'search-submit') this._doTheSearch(event)
    else if(target.classList.contains('suggestion')) this._handleSuggestionClick(event)
    else if(target.classList.contains('page-link') && target.dataset.url) this._doTheSearch(event, target.dataset.url)
    else if(target.classList.contains('ticket-link')) this._handleResultLinkClick(event)
  }

  async _getBrands(){
    const brands = (await this._client.request({
      url: this._apis.brands,
      cors: true
    })).brands;
    if (brands.length > 1) this._states.hasMultiplebBrands = true;
    const currentTicketBrand = this._ticket.brand;
    return brands.map((brand) => {
      return {
        value: brand.id,
        label: brand.name,
        selected: brand.id === currentTicketBrand.id
      };
    });
  }

  async _loadSearchSuggestions() {
    const searchSuggestions = [],
          customFieldIDs = this._appData.metadata.settings.custom_fields.match(/\d+/g),
          isRelatedTicketsConfigOn = this._appData.metadata.settings.related_tickets, 
          ticketSubject = (await this._client.get('ticket.subject'))['ticket.subject'];
    // custom field suggestions
    if (customFieldIDs.length) {
      await customFieldIDs.reduce((p, id) => {
        const customFieldName = `ticket.customField:custom_field_${id}`;
        return p.then(() => {
          return this._client.get(customFieldName).then((value) => {
            if(value[customFieldName]){
              searchSuggestions.push(value[customFieldName]);
            }
          });
        })
      }, Promise.resolve())
    }
    // ticket subject suggestions
    if(isRelatedTicketsConfigOn && ticketSubject) {
      // strip punctuation and extra spaces, split by spaces
      const words = ticketSubject.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ").split(" "),
            exclusions = I18n.t('stopwords.exclusions').split(","),
            keywords = words.filter((w) => {
                        return !exclusions.includes(w);
                      });
      searchSuggestions.push(...keywords);
    }
    return searchSuggestions;
  }

  async _populateAssignees() {
    return (await this._client.request({
      url: this._apis.users,
      cors: true
    })).users;
  }

  async _doTheSearch(event, url) {
    event.preventDefault();
    this._resultsContainer.classList.add('loading');
    resizeContainer(this._client, MAX_HEIGHT);
    url = url || this._apis.search + encodeURIComponent(this._getSearchParams());
    const results = await this._client.request({
      url: url,
      cors: true
    }).catch(this._handleSearchFail.bind(this));
    results && this._handleSearchResults(results);
  }

  _getSearchParams() {
    const params = [],
          $search = this._appContainer.querySelector('.search'),
          searchType = $search.querySelector('#type').value,
          searchTerm = this._keywordField.value;
    if(searchType !== "all"){
      params.push(`type:${searchType}`);
    }
    if(this._states.showAdvancedOptions){
      // Status
      const filter = $search.querySelector('#filter').value,
            condition = $search.querySelector('#condition').value,
            value = $search.querySelector('#value').value;
      if(filter && condition && value) params.push([filter, condition, value].join(''));
      // Created
      const range = $search.querySelector('#range').value,
            from = $search.querySelector('#from').value,
            to = $search.querySelector('#to').value;
      if(range && from) params.push(`${range}>${from}`);
      if(range && to) params.push(`${range}<${to}`);
      // Assignee
      const assignee = $search.querySelector('#assignee').value;
      if(assignee) params.push(`assignee:"${assignee}"`);
      // Brand
      const brand = $search.querySelector('#brand-filter').value;
      if(this._states.hasMultiplebBrands) brand && params.push(`brand_id:"${brand}"`);
    }
    if(params.length) return `${searchTerm} ${params.join(" ")}`;
    return searchTerm;
  }

  _handleSearchResults(data) {
    this._states.results = data.results.filter((result, index) => {
      // format descriptions
      if(result.result_type === 'ticket'){
        if (result.id === this._ticket.id) return true;
        result.description = result.description.substr(0,300).concat("...");
      }
      return true;
    });
    this._states.pagination = {
      is_paged: !!(data.next_page || data.previous_page),
      previous_page: data.previous_page,
      next_page: data.next_page,
      count: I18n.t('search.results', { count: data.count })
    };
    this._renderTemplate('.results', getResultsTemplate);
  }

  _handleSearchFail(data) {
    const response = JSON.parse(data.responseText);
    let message = '';
    if(response.error){ message = I18n.t(`global.error.${response.error}`); }
    else if(response.description){ message = response.description; }
    else{ message = I18n.t('global.error.message'); }
    this._states.error = {
      title: I18n.t('global.error.title'),
      message: message
    };
    this._renderTemplate('.results', getErrorTemplate);
  }

  _handleAdvancedFieldsToggle(event){
    this._states.showAdvancedOptions = event.target.checked;
    this._appContainer.querySelector('.advanced-options-wrapper').classList.toggle('u-display-block');
    resizeContainer(this._client, MAX_HEIGHT);
  }

  _handleSuggestionClick(event){
    this._keywordField.value = `${this._keywordField.value} ${event.target.textContent}`.trim();
    this._doTheSearch(event);
  }

  _handleResultLinkClick(event){
    event.preventDefault();
    console.log(event.target.dataset.id);
    this._client.invoke('routeTo', 'ticket', event.target.dataset.id);
  }

  _handleKeydown(event) {
    event.which === 13 && this._doTheSearch(event);
  }

  _renderTemplate(container, template){
    this._resultsContainer.classList.remove('loading');
    this._appContainer.querySelector(container).innerHTML = template(this._states);
    resizeContainer(this._client, MAX_HEIGHT);
  }
}

export default Search;