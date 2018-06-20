/* global describe, it, jest, expect, CustomEvent, MouseEvent, KeyboardEvent, beforeEach */
import Search from '../src/javascript/modules/search'
import {
  BRANDS_SINGLE,
  BRANDS_MULTI,
  ASSIGNEES,
  RESULTS_MULTI_PAGE,
  RESULTS_SINGLE_PAGE,
  RESULTS_EMPTY,
  RESULTS_FIRST_PAGE,
  RESULTS_LAST_PAGE,
  CLIENT,
  APPDATA_WITH_CF,
  APPDATA_WITHOUT_CF,
  CONFIG,
  createRangePolyfill
} from './mocks'

jest.mock('../src/javascript/lib/i18n', () => {
  return {
    loadTranslations: () => {},
    t: () => 'translation...'
  }
})

if (!document.createRange) {
  createRangePolyfill()
}

describe('Search App', () => {
  describe('Initialization Failure', () => {
    let app
    beforeEach((done) => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.reject({responseText: '{"description": "fake error"}'}))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
      app._initializePromise.then(() => {
        done()
      })
    })

    it('should render error message', () => {
      expect(app._states.isError).toBe(true)
      expect(app._states.error.message).toBe('fake error')
    })
  })

  describe('Multi Brands, Custom Fields = set, Related tickets = true', () => {
    let doTheSearchSpy, app
    beforeEach((done) => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_MULTI))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
      doTheSearchSpy = jest.spyOn(app, '_doTheSearch')
      app._initializePromise.then(() => {
        app._keywordField.value = 'TestKeyword'
        done()
      })
    })

    it('should render search form', () => {
      const searchForm = document.querySelector('.search-app')
      expect(searchForm).not.toBe(null)
    })

    it('should populate brands dropdown', () => {
        expect(app._states.brands.length).toBe(2)
    })

    it('should populate assignees dropdown', () => {
      expect(app._states.assignees.length).toBe(1)
    })

    it('should populate search suggestions', () => {
      expect(app._states.suggestions.length).toBe(3)
    })

    it('should hide advanced search options', () => {
      const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
      expect(app._states.showAdvancedOptions).toBe(false)
      expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(false)
    })

    it('should toggle advanced search options', () => {
      const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
      app._advancedToggle.click()
      expect(app._states.showAdvancedOptions).toBe(true)
      expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(true)
    })

    it('should trigger search when keyword field focused and press entry key', () => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._keywordField.dispatchEvent(new KeyboardEvent('keydown', { 'which': 13 }))
      expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
      app._keywordField.dispatchEvent(new KeyboardEvent('keydown', { 'which': 32 }))
      expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
    })

    it('should trigger search when search button is clicked', () => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      document.querySelector('#search-submit svg').dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
      )
      expect(doTheSearchSpy).toHaveBeenCalled()
    })

    it('should trigger search when suggestion tag is clicked', () => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      document.querySelector('.suggestion').click()
      expect(doTheSearchSpy).toHaveBeenCalled()
      expect(app._keywordField.value).toBe('TestKeyword cf_suggestion_1')
    })

    it('should trigger search when nav link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        document.querySelector('.page-link').click()
        expect(doTheSearchSpy).toHaveBeenCalledTimes(2)
        done()
      })
    })

    it('should not trigger search if search term is empty', (done) => {
      app._client.request = jest.fn()
      app._keywordField.value = ''
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._client.request).not.toHaveBeenCalled()
        done()
      })
    })

    it('should show paginations on first page', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_FIRST_PAGE))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(document.querySelector('.c-pagination__page--previous').dataset.url).toBe('')
        expect(document.querySelector('.c-pagination__page--next').dataset.url).not.toBe('')
        done()
      })
    })

    it('should show paginations on first page', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_LAST_PAGE))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(document.querySelector('.c-pagination__page--previous').dataset.url).not.toBe('')
        expect(document.querySelector('.c-pagination__page--next').dataset.url).toBe('')
        done()
      })
    })

    it('should not show paginations with one page results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_SINGLE_PAGE))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._states.pagination.is_paged).toBe(false)
        done()
      })
    })

    it('should show result message with empty results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_EMPTY))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(document.querySelector('.results-wrapper').textContent).toBe('translation...')
        done()
      })
    })

    it('should open a new ticket when ticket result link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        document.querySelector('.ticket-link').click()
        expect(CLIENT.invoke).toHaveBeenCalledWith('routeTo', 'ticket', '6')
        done()
      })
    })

    it('should compose search terms from form fields', () => {
      expect(app._getSearchParams()).toBe('TestKeyword')

      document.querySelector('#type').value = 'ticket'
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket')

      app._advancedToggle.click()
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket brand_id:"360000636152"')

      document.querySelector('#filter').value = 'status'
      document.querySelector('#condition').value = '>'
      document.querySelector('#value').value = 'closed'
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket status>closed brand_id:"360000636152"')

      document.querySelector('#range').value = 'created'
      document.querySelector('#from').value = '2018-06-01'
      document.querySelector('#to').value = '2018-06-07'
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket status>closed created>2018-06-01 created<2018-06-07 brand_id:"360000636152"')

      document.querySelector('#assignee').value = 'TT'
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket status>closed created>2018-06-01 created<2018-06-07 assignee:"TT" brand_id:"360000636152"')

      document.querySelector('#brand-filter').value = ''
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket status>closed created>2018-06-01 created<2018-06-07 assignee:"TT"')
    })

    it('should handle search request failure with error description', (done) => {
      app._client.request.mockReturnValueOnce(Promise.reject({responseText: '{"description": "fake error"}'}))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._states.isError).toBe(true)
        expect(app._states.error.message).toBe('fake error')
        done()
      })
    })

    it('should handle search request failure with error code', (done) => {
      CLIENT.request.mockReturnValueOnce(Promise.reject({responseText: '{"error": "fakeerrorcode"}'}))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._states.isError).toBe(true)
        expect(app._states.error.message).toBe('translation...')
        done()
      })
    })

    it('should handle search request failure with global error message', (done) => {
      CLIENT.request.mockReturnValueOnce(Promise.reject({responseText: '{}'}))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._states.isError).toBe(true)
        expect(app._states.error.message).toBe('translation...')
        done()
      })
    })
  })

  describe('Single Brand, Custom Fields = set, Related tickets = true', () => {
    let app
    beforeEach((done) => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_SINGLE))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
      app._initializePromise.then(() => {
        done()
        app._keywordField.value = 'TestKeyword'
      })
    })

    it('should not render brands dropdown', () => {
      expect(document.querySelector('#brand-filter')).toBe(null)
    })

    it('should compose search terms without brands', () => {
      app._advancedToggle.click()
      expect(app._getSearchParams()).toBe('TestKeyword')
    })
  })

  describe('Single Brand, no Custom Fields, Related tickets = false', () => {
    let app
    beforeEach((done) => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_SINGLE))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITHOUT_CF, CONFIG)
      app._initializePromise.then(() => {
        done()
      })
    })

    it('should populate search suggestions', () => {
      expect(app._states.suggestions.length).toBe(0)
    })
  })
})
