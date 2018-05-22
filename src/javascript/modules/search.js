/**
 *  Search module
 **/

import Storage from '../lib/storage';
// import React from 'react';
// import ReactDOM from 'react-dom';
// import Select from '@zendeskgarden/react-select';
// import {Buttons} from '@zendeskgarden/react-buttons';
// import TextField from '@zendeskgarden/react-textfields/TextField';
// import Toggles from '@zendeskgarden/react-toggles';
// import Tags from '@zendeskgarden/react-tags';
// import Pagination from '@zendeskgarden/react-pagination';

// ReactDOM.render(
//   <h1>Hello, world!</h1>,
//   document.getElementById('root')
// );

const PER_PAGE = 10,
      MAX_ATTEMPTS = 20;
// const agentOptions = [];

class Search{
  constructor(client, appData, config) {
    console.log(client, appData);
    this._client = client;
    this._appData = appData;
    this._config = config;
    this.requiredProperties = this._config.requiredProperties || []; // ???
    // this._storage = new Storage(this._metadata.installationId, true);
    this._api_endpoints = {
      brands: `${this._client._origin}/api/v2/brands.json`,
      users: '/api/v2/group_memberships/assignable.json?include=users&page=1',
      search: '/api/v2/search.json?per_page=PER_PAGE&query='
    }
    this._events = {
      'app.created': 'init',
      '*.changed': 'handleChanged',
      'searchDesk.done': 'handleResults',
      'searchDesk.fail': 'handleFail',
      'getUsers.done': 'handleUsers',
      'click .options a': 'toggleAdvanced',
      'click .suggestion': 'suggestionClicked',
      'click #search-submit': 'doTheSearch',
      'click .page-link': 'fetchPage',
      'keydown .search-box': 'handleKeydown'
    };
    this.hasActivated = true;
    this.currAttempt = 0;
    this.customFieldIDs = this._appData.metadata.settings.custom_fields 
                          ? 
                          this._appData.metadata.settings.custom_fields.match(/\d+/g)
                          :
                          [];
    this.init();
  }

  async init(){
    this.brands = (await this._client.request({
      url: this._api_endpoints.brands,
      cors: true
    })).brands;
    this.ticket = (await this._client.get('ticket')).ticket;

    await this.getBrandsDone();
    // this.switchTo('search');
    await this.loadSearchSuggestions();
  }

  async getBrandsDone() {
    // If has multiple brands
    if (this.brands.length > 1) {
      var options = this.brands.map(function(brand) {
        return { value: brand.id, label: brand.name };
      });

      // this.$('.advanced-options')
      //     .append(this.renderTemplate('brand-filter', { options: options }))
      //     .find('.brand-filter')
      //     .zdSelectMenu();
      
      var brand = this.ticket.brand;
      // this.$('.brand-filter').zdSelectMenu('setValue', brand && brand.id());
    }
  }

  async loadSearchSuggestions() {
    var searchSuggestions = await this.loadCustomFieldSuggestions(),
        ticketSubject = (await this._client.get('ticket.subject'))['ticket.subject'],
        suggestionsTemplate = "",
        keywords = "";

    if (this._appData.metadata.settings.related_tickets && ticketSubject) {
      keywords = this.extractKeywords(ticketSubject);
      searchSuggestions.push.apply( searchSuggestions, keywords );
    }

    suggestionsTemplate = this.renderTemplate('suggestions', { searchSuggestions: searchSuggestions });
    this.$('.suggestions').html(suggestionsTemplate);
  }

  async loadCustomFieldSuggestions() {
    var customFieldSuggestions = [];

    if (this.customFieldIDs.length) {
      let promises = this.customFieldIDs.map((id) => {
        let customFieldName = 'custom_field_' + customFieldID;
        return this._client.get(`ticket.customField:${customFieldName}`);
      })
      Promise.all(promises).then((values) => {
        customFieldSuggestions = values.filter((val) => {
          return val !== '';
        });
      })
    }
    return customFieldSuggestions;
  }
  
  doTheSearch() {
    this.$('.results').empty();
    this.$('.searching').show();

    // encodeURIComponent is used here to force IE to encode all characters
    this.ajax('searchDesk', { query: encodeURIComponent(this.searchParams()) });
  }

  searchParams() {
    var $search = this.$('.search');
    var params = [];
    var searchType = $search.find('#type').val();
    var searchTerm = $search.find('.search-box').val();

    if (searchType !== "all") {
      params.push( helpers.fmt('type:%@', searchType) );
    }

    if (this.$('.advanced-options').is(':visible')) {

      // Status
      var filter = $search.find('#filter').val();
      var condition = $search.find('#condition').val();
      var value = $search.find('#value').val();

      if (filter && condition && value) {
        params.push([filter, condition, value].join(''));
      }

      // Created
      var range = $search.find('#range').val();
      var from = $search.find('#from').val();
      var to = $search.find('#to').val();

      if (range && (from || to)) {
        if (from) {
          params.push( helpers.fmt('%@>%@', range, from) );
        }
        if (to) {
          params.push( helpers.fmt('%@<%@', range, to) );
        }
      }

      // Assignee
      var assignee = $search.find('#assignee').val();

      if (assignee) {
        params.push( helpers.fmt('assignee:"%@"', assignee) );
      }

      if (this.hasMultipleBrands) {
        var brand = $search.find('.brand-filter').zdSelectMenu('value');

        if (brand) {
          params.push( helpers.fmt('brand_id:"%@"', brand) );
        }
      }
    }

    return helpers.fmt('%@ %@', searchTerm, params.join(" "));
  }
  
  toggleAdvanced(e){
    e.preventDefault();
    var $advancedOptions = this.$('.advanced-options-wrapper');
    if($advancedOptions.is(':hidden')){
      this.$('.options .basic').show();
      this.$('.options .advanced').hide();

      // Load users when advanced is clicked
      this.populateAssignees();

      $advancedOptions.slideDown();
      $advancedOptions.addClass('visible');
    } else {
      $advancedOptions.slideUp();

      this.$('.options .advanced').show();
      this.$('.options .basic').hide();
      $advancedOptions.removeClass('visible');
    }
  }

  populateAssignees() {
    if (!this.agentOptions.length) {
      this.ajax('getUsers');
    } else if (this.$('#assignee option').length === 1) {
      // used cached agentOptions
      this._populateSelectBox('#assignee', this.agentOptions);
    }
  }

  extractKeywords(text) {
    // strip punctuation and extra spaces
    text = text.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

    // split by spaces
    var words = text.split(" "),
        exclusions = this.I18n.t('stopwords.exclusions').split(","),
        keywords = _.difference(words, exclusions);

    return keywords;
  }

  suggestionClicked(e) {
    var $searchBox = this.$('.search-box');
    $searchBox.val( $searchBox.val() + ' ' + this.$(e.target).text() );
    this.doTheSearch();
    return false;
  }

  handleKeydown(e) {
    if (e.which === 13) {
      this.doTheSearch();
      return false;
    }
  }

  // handleChanged: _.debounce(function(property) {
  //   // test if change event fired before app.activated
  //   if (!this.hasActivated) {
  //     return;
  //   }

  //   var ticketField = property.propertyName,
  //       ticketFieldsChanged = false;

  //   if (ticketField.match(/custom_field/) && this.customFieldIDs.length) {
  //     ticketFieldsChanged = !!_.find(this.customFieldIDs, function(id) {
  //       return ticketField === helpers.fmt("ticket.custom_field_%@", id);
  //     });
  //   } else if (ticketField === 'ticket.subject') {
  //     ticketFieldsChanged = true;
  //   }

  //   if (ticketFieldsChanged) {
  //     this.loadSearchSuggestions();
  //   }
  // }, 500),

  fetchPage(e) {
    e.preventDefault();
    this.$('.results').empty();
    this.$('.searching').show();
    var pageUrl = this.$(e.currentTarget).data('url');
    this.ajax('searchDesk', { pageUrl: pageUrl });
  }

  handleUsers(data) {
    // populate the assignee drop down, excluding duplicates
    _.each(data.users, function(agent) {
      if (!_.contains(this.agentOptions, agent.name)) {
        this.agentOptions.push(agent.name);
      }
    }, this);

    if (data.next_page) {
      this.ajax('getUsers', data.next_page);
    } else {
      // we have all assignable users, sort and add to select box
      this.agentOptions.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      this._populateSelectBox('#assignee', this.agentOptions);
    }
  }

  handleResults(data) {
    var ticketId = this.ticket().id();

    data.results = _.filter(data.results, function(result, index) {
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
    data.count = this.I18n.t('search.results', { count: data.count });
    var resultsTemplate = this.renderTemplate('results', data);
    this.$('.searching').hide();
    this.$('.results').html(resultsTemplate);
  }

  paginate(data) {
    data.page_count = Math.ceil(data.count / this.PER_PAGE);
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
      message = this.I18n.t("global.error.%@".fmt(response.error));
    } else if (response.description) {
      message = response.description;
    } else {
      message = this.I18n.t('global.error.message');
    }

    var error = {
      title: this.I18n.t('global.error.title'),
      message: message
    };

    var errorTemplate = this.renderTemplate('error', error);

    this.$('.searching').hide();
    this.$('.results').html(errorTemplate);
  }

  // showError: function(title, msg) {
  //   this.switchTo('error', {
  //     title: title || this.I18n.t('global.error.title'),
  //     message: msg || this.I18n.t('global.error.message')
  //   });
  // },

  _populateSelectBox(selector, values) {
    var htmlOptions = _.reduce(values, function(options, value) {
      return options + helpers.fmt('<option value="%@1">%@1</option>', value);
    }, '<option value="">-</option>');

    this.$(selector).html(htmlOptions);
  }

  // _safeGetPath: function(propertyPath) {
  //   return _.inject( propertyPath.split('.'), function(context, segment) {
  //     if (context == null) { return context; }
  //     var obj = context[segment];
  //     if (_.isFunction(obj)) { obj = obj.call(context); }
  //     return obj;
  //   }, this);
  // },

  // _validateRequiredProperty: function(propertyPath) {
  //   var value = this._safeGetPath(propertyPath);
  //   return value != null && value !== '' && value !== 'no';
  // },
}

export default Search;
