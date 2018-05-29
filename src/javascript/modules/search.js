/**
 *  Search module
 **/

import Storage from '../lib/storage';
import I18n from '../lib/i18n';
import getBrandFilterTemplate from '../../templates/brand-filter';
import getErrorTemplate from '../../templates/error';
import getLoadingTemplate from '../../templates/loading';
import getResultsTemplate from '../../templates/results';
import getSearchTemplate from '../../templates/search';
import getSuggestionsTemplate from '../../templates/suggestions';

const PER_PAGE = 2,
      MAX_ATTEMPTS = 20,
      MAX_HEIGHT = 1000;

class Search{
  constructor(client, appData, config) {
    console.log(client, appData);
    this._client = client;
    this._appData = appData;
    this._config = config;
    this.agentOptions = [];
    // this._storage = new Storage(this._metadata.installationId, true);
    this._api_endpoints = {
      brands: `${this._client._origin}/api/v2/brands.json`,
      users: `${this._client._origin}/api/v2/group_memberships/assignable.json?include=users&page=1`,
      search: `${this._client._origin}/api/v2/search.json?per_page=${PER_PAGE}&query=`
    }
    this._showAdvancedOptions = false;
    this._customFieldIDs = this._appData.metadata.settings.custom_fields
                          ? 
                          this._appData.metadata.settings.custom_fields.match(/\d+/g)
                          :
                          [];
    this.container = document.querySelector('[data-main]');
    this.init();
  }

  async init(){
    this.currentUser = (await this._client.get('currentUser')).currentUser;
    I18n.loadTranslations(this.currentUser.locale);

    this.ticket = (await this._client.get('ticket')).ticket;
    this.container.innerHTML = getSearchTemplate();
    await this.getBrands();
    await this.loadSearchSuggestions();
    const newHeight = Math.min(document.body.clientHeight, MAX_HEIGHT);
    this._client.invoke('resize', { height: newHeight });
    document.querySelector('#search-submit').addEventListener('click', this.doTheSearch.bind(this));
    document.querySelector('.options a').addEventListener('click', this.toggleAdvanced.bind(this));
    document.querySelector('.suggestions').addEventListener('click', this.suggestionClicked.bind(this));
    document.querySelector('.search-box').addEventListener('keydown', this.handleKeydown.bind(this));
    document.querySelector('.results').addEventListener('click', this.fetchPage.bind(this));
  }

  async getBrands() {
    this.brands = (await this._client.request({
      url: this._api_endpoints.brands,
      cors: true
    })).brands;
    if (this.brands.length > 1) {

      var options = this.brands.map(function(brand) {
        return { value: brand.id, label: brand.name };
      });
      let brand = this.ticket.brand;
      let fragment = document.createRange().createContextualFragment(getBrandFilterTemplate({options: options}));
      document.querySelector('.advanced-options').appendChild(fragment);
    }
  }

  async loadSearchSuggestions() {
    let searchSuggestions = [],
        isRelatedTicketsConfigOn = this._appData.metadata.settings.related_tickets;

    if (this._customFieldIDs.length) {
      await this._customFieldIDs.reduce((p, id) => {
        let customFieldName = `ticket.customField:custom_field_${id}`;
        return p.then(() => {
          return this._client.get(customFieldName).then((value) => {
            if(value[customFieldName]){
              searchSuggestions.push(value[customFieldName]);
            }
          });
        })
      }, Promise.resolve())
    }

    let ticketSubject = (await this._client.get('ticket.subject'))['ticket.subject'];
    if (isRelatedTicketsConfigOn && ticketSubject) {
      let keywords = this.extractKeywords(ticketSubject);
      searchSuggestions.push(...keywords);
    }

    let suggestionsTemplate = getSuggestionsTemplate({searchSuggestions: searchSuggestions});
    let fragment = document.createRange().createContextualFragment(suggestionsTemplate);
    document.querySelector('.suggestions').appendChild(fragment);
  }

  extractKeywords(text) {
    // strip punctuation and extra spaces
    text = text.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

    // split by spaces
    var words = text.split(" "),
        exclusions = I18n.t('stopwords.exclusions').split(","),
        keywords = words.filter((w) => {
          return !exclusions.includes(w);
        })
    return keywords;
  }

  doTheSearch(url = '') {
    document.querySelector('.results').innerHTML = '';
    // this.$('.searching').show();
    let searchParams = this.getSearchParams();
    // encodeURIComponent is used here to force IE to encode all characters
    this._client.request({
      url: url ? url : this._api_endpoints.search + encodeURIComponent(this.getSearchParams()),
      cors: true
    }).then(
      this.handleResults.bind(this),
      this.handleFail.bind(this)
    )
  }

  getSearchParams() {
    var $search = document.querySelector('.search');
    var params = [];
    var searchType = $search.querySelector('#type').value;
    var searchTerm = $search.querySelector('.search-box').value;
    if (searchType !== "all") {
      params.push(`type:${searchType}`);
    }

    if (this._showAdvancedOptions) {

      // Status
      var filter = $search.querySelector('#filter').value;
      var condition = $search.querySelector('#condition').value;
      var value = $search.querySelector('#value').value;

      if (filter && condition && value) {
        params.push([filter, condition, value].join(''));
      }

      // Created
      var range = $search.querySelector('#range').value;
      var from = $search.querySelector('#from').value;
      var to = $search.querySelector('#to').value;

      if (range && (from || to)) {
        if (from) {
          params.push(`${range}>${from}`);
        }
        if (to) {
          params.push(`${range}<${to}`);
        }
      }

      // Assignee
      var assignee = $search.querySelector('#assignee').value;
      if (assignee) {
        params.push(`assignee:"${assignee}"`);
      }

      if (this.brands.length > 1) {
        var brand = $search.querySelector('.brand-filter').value;
        if (brand) {
          params.push(`brand_id:"${brand}"`);
        }
      }
    }

    return `${searchTerm}${params.length ? ` ${params.join(" ")}` : ''}`;
  }

  handleResults(data) {
    var ticketId = this.ticket.id;
    data.results = data.results.filter(function(result, index) {
      result["is_" + result.result_type] = true;

      // format descriptions
      if (result.is_ticket) {
        if (result.id !== ticketId) {
          result.description = result.description.substr(0,300).concat("...");
          return result;
        }
      } else {
        return result;
      }
    });
    this.paginate(data);
    data.count = I18n.t('search.results', { count: data.count });
    // this.$('.searching').hide();
    document.querySelector('.results').innerHTML = getResultsTemplate(data);
    const newHeight = Math.min(document.body.clientHeight, MAX_HEIGHT);
    this._client.invoke('resize', { height: newHeight });
  }

  paginate(data) {
    data.page_count = Math.ceil(data.count / PER_PAGE);
    data.is_paged = (data.page_count > 1) ? true : false;

    // determine current page number
    if (data.previous_page === null) {
      data.current_page = 1;
    } else if (data.next_page === null) {
      data.current_page = data.page_count;
    } else {
      var nextPageNum = this._getUrlParams(data.next_page).page;
      data.current_page = nextPageNum - 1;
    }
  }

  _getUrlParams(url) {
    var queryString = url.substring(url.indexOf('?') + 1) || "",
        keyValPairs = [],
        params      = {};

    if (queryString.length) {
      keyValPairs = queryString.split('&');
      for (var pairNum = 0; pairNum < keyValPairs.length; pairNum++) {
        var key = keyValPairs[pairNum].split('=')[0];
        params[key] = (keyValPairs[pairNum].split('=')[1]);
      }
    }

    return params;
  }

  handleFail(data) {
    var response = JSON.parse(data.responseText);
    var message = "";

    if (response.error) {
      message = I18n.t(`global.error.${response.error}`);
    } else if (response.description) {
      message = response.description;
    } else {
      message = I18n.t('global.error.message');
    }

    var error = {
      title: I18n.t('global.error.title'),
      message: message
    };

    // this.$('.searching').hide();
    document.querySelector('.results').innerHTML = getErrorTemplate(error);
    const newHeight = Math.min(document.body.clientHeight, MAX_HEIGHT);
    this._client.invoke('resize', { height: newHeight });
  }

  toggleAdvanced(e){
    e.preventDefault();
    this._showAdvancedOptions = !this._showAdvancedOptions;
    var $advancedOptions = document.querySelector('.advanced-options-wrapper');
    if(this._showAdvancedOptions){
      // Load users when advanced is clicked
      this.populateAssignees();
      $advancedOptions.classList.add('visible');
    } else {
      $advancedOptions.classList.remove('visible');
    }
  }

  populateAssignees() {
    if (!this.agentOptions.length) {
      this._client.request({
        url: this._api_endpoints.users,
        cors: true
      }).then(
        this.handleUsers.bind(this),
        this.handleFail.bind(this)
      )
    } else if (document.querySelectorAll('#assignee option').length === 1) {
      // used cached agentOptions
      this._populateSelectBox('#assignee', this.agentOptions);
    }
  }

  handleUsers(data) {
    // populate the assignee drop down, excluding duplicates
    data.users.forEach(function(agent) {
      if (!this.agentOptions.includes(agent.name)) {
        this.agentOptions.push(agent.name);
      }
    }, this);
    if (data.next_page) {
      this._client.request({
        url: data.next_page,
        cors: true
      }).then(
        this.handleUsers.bind(this),
        this.handleFail.bind(this)
      )
    } else {
      // we have all assignable users, sort and add to select box
      this.agentOptions.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
      this._populateSelectBox('#assignee', this.agentOptions);
    }
  }

  _populateSelectBox(selector, values) {
    var htmlOptions = values.reduce(function(options, value) {
      return `${options}<option value="${value}">${value}</option>`;
    }, '<option value="">-</option>');
    document.querySelector(selector).innerHTML = htmlOptions;
  }

  suggestionClicked(e) {
    e.preventDefault();
    if(e.target.classList.contains('suggestion')){
      var $searchBox = document.querySelector('.search-box');
      $searchBox.setAttribute('value', `${$searchBox.value} ${e.target.textContent}`.trim());
      this.doTheSearch();
    }
  }

  handleKeydown(e) {
    if (e.which === 13) {
      this.doTheSearch();
      return false;
    }
  }

  fetchPage(e) {
    e.preventDefault();
    if(e.target.classList.contains('page-link')){
      document.querySelector('.results').innerHTML = '';
      // this.$('.searching').show();
      this.doTheSearch(e.target.dataset.url);
    }
  }
}

export default Search;
