/**
 *  Search module
 **/

import Storage from '../lib/storage';
import I18n from '../lib/i18n';
import getBrandFilterTemplate from '../../templates/brand-filter';
import getErrorTemplate from '../../templates/error';
import getResultsTemplate from '../../templates/results';
import getSearchTemplate from '../../templates/search';
import getSuggestionsTemplate from '../../templates/suggestions';

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
    this._showAdvancedOptions = false;
    this._hasMultiplebBrands = false;
    // this._storage = new Storage(this._metadata.installationId, true);
    this._init();
  }

  async _init(){
    const currentUser = (await this._client.get('currentUser')).currentUser;
    I18n.loadTranslations(currentUser.locale);
    this._ticket = (await this._client.get('ticket')).ticket;
    const searchFragment = document.createRange().createContextualFragment(getSearchTemplate());
    this._appContainer = searchFragment.querySelector('.search-app');
    this._keywordField = searchFragment.querySelector('.search-box');
    await this._getBrands();
    await this._loadSearchSuggestions();
    await this._populateAssignees();
    this._appContainer.addEventListener('click', this._eventHandlerDispatch.bind(this));
    this._keywordField.addEventListener('keydown', this._handleKeydown.bind(this));
    document.querySelector('[data-main]').replaceChild(searchFragment, document.querySelector('.loader'));
    this._resizeContainer();
  }

  _eventHandlerDispatch(event){
    event.preventDefault();
    const target = event.target;
    if(target.getAttribute('id') === 'search-submit') this._doTheSearch(event)
    else if(target.parentNode.classList.contains('toggle-advanced')) this._toggleAdvanced(event)
    else if(target.classList.contains('suggestion')) this._suggestionClicked(event)
    else if(target.classList.contains('page-link')) this._fetchPage(event)
  }

  async _getBrands(){
    const brands = (await this._client.request({
      url: this._apis.brands,
      cors: true
    })).brands;
    if (brands.length > 1) {
      this._hasMultiplebBrands = true;
      const currentTicketBrand = this._ticket.brand;
      const options = brands.map((brand) => {
        return {
          value: brand.id,
          label: brand.name,
          selected: brand.id === currentTicketBrand.id
        };
      });      
      const fragment = document.createRange().createContextualFragment(getBrandFilterTemplate({options: options}));
      this._appContainer.querySelector('.advanced-options').appendChild(fragment);
    }
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
    const fragment = document.createRange().createContextualFragment(getSuggestionsTemplate({searchSuggestions: searchSuggestions}));
    this._appContainer.querySelector('.suggestions').appendChild(fragment);
  }

  async _populateAssignees() {
    const assignees = (await this._client.request({
      url: this._apis.users,
      cors: true
    })).users;
    const htmlOptions = assignees.reduce(
      (options, assignee) => {
        return `${options}<option value="${assignee.name}">${assignee.name}</option>`;
      },
      '<option value="">-</option>');
    this._appContainer.querySelector('#assignee').innerHTML = htmlOptions;
  }

  _doTheSearch(ev, url) {
    url = url || this._apis.search + encodeURIComponent(this._getSearchParams());
    return this._client.request({
      url: url,
      cors: true
    }).then(
      this._handleResults.bind(this),
      this._handleFail.bind(this)
    )
  }

  _getSearchParams() {
    const params = [],
          $search = this._appContainer.querySelector('.search'),
          searchType = $search.querySelector('#type').value,
          searchTerm = this._keywordField.value;
    if(searchType !== "all"){
      params.push(`type:${searchType}`);
    }
    if(this._showAdvancedOptions){
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
      const brand = $search.querySelector('.brand-filter').value;
      if(this._hasMultiplebBrands) brand && params.push(`brand_id:"${brand}"`)
    }
    if(params.length) return `${searchTerm} ${params.join(" ")}`;
    return searchTerm;
  }

  _handleResults(data) {
    const ticketId = this._ticket.id;
    data.results = data.results.filter((result, index) => {
      result["is_" + result.result_type] = true;
      // format descriptions
      if(result.result_type === 'ticket'){
        if (result.id === ticketId) return false;
        result.description = result.description.substr(0,300).concat("...");
      }
      return true;
    });
    this._paginate(data);
    data.count = I18n.t('search.results', { count: data.count });
    this._appContainer.querySelector('.results').innerHTML = getResultsTemplate(data);
    this._resizeContainer();
  }

  _paginate(data) {
    data.is_paged = true;
    data.pages = [
      {
        url: '#1',
        number: 1
      },
      {
        url: '#2',
        number: 2
      },
      {
        url: '#3',
        number: 3
      },
    ];
  }

  _handleFail(data) {
    const response = JSON.parse(data.responseText);
    let message = "";
    if(response.error){
      message = I18n.t(`global.error.${response.error}`);
    } else if(response.description){
      message = response.description;
    } else{
      message = I18n.t('global.error.message');
    }
    const error = {
      title: I18n.t('global.error.title'),
      message: message
    };
    this._appContainer.querySelector('.results').innerHTML = getErrorTemplate(error);
    this._resizeContainer();
  }

  _toggleAdvanced(e){
    this._showAdvancedOptions = !this._showAdvancedOptions;
    const $advancedOptions = this._appContainer.querySelector('.advanced-options-wrapper');
    if(this._showAdvancedOptions){
      $advancedOptions.classList.add('visible');
    } else {
      $advancedOptions.classList.remove('visible');
    }
  }

  _suggestionClicked(e) {
    this._keywordField.setAttribute('value', `${this._keywordField.value} ${e.target.textContent}`.trim());
    this._doTheSearch(e);
  }

  _handleKeydown(e) {
    e.which === 13 && this._doTheSearch(e);
  }

  _fetchPage(e) {
    this._doTheSearch(e, e.target.dataset.url);
  }

  _resizeContainer(){
    const newHeight = Math.min(document.body.clientHeight, MAX_HEIGHT);
    return this._client.invoke('resize', { height: newHeight });
  }
}

export default Search;
