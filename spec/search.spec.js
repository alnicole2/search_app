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
  describe('Multi Brands, Custom Fields = set, Related tickets = true', () => {
    let doTheSearchSpy, app
    beforeEach(() => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_MULTI))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
      doTheSearchSpy = jest.spyOn(app, '_doTheSearch')
    })

    it('should render search form', (done) => {
      app._initializePromise.then(() => {
        const searchForm = document.querySelector('.search-app')
        expect(searchForm).not.toBe(null)
        done()
      })
    })

    it('should populate brands dropdown', (done) => {
      app._initializePromise.then(() => {
        expect(app._states.brands.length).toBe(2)
        done()
      })
    })

    it('should populate assignees dropdown', (done) => {
      app._initializePromise.then(() => {
        expect(app._states.assignees.length).toBe(1)
        done()
      })
    })

    it('should populate search suggestions', (done) => {
      app._initializePromise.then(() => {
        expect(app._states.suggestions.length).toBe(3)
        done()
      })
    })

    it('should hide advanced search options', (done) => {
      app._initializePromise.then(() => {
        const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
        expect(app._states.showAdvancedOptions).toBe(false)
        expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(false)
        done()
      })
    })

    it('should toggle advanced search options', (done) => {
      app._initializePromise.then(() => {
        const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
        app._advancedToggle.click()
        expect(app._states.showAdvancedOptions).toBe(true)
        expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(true)
        done()
      })
    })

    it('should trigger search when keyword field focused and press entry key', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._initializePromise.then(() => {
        app._keywordField.dispatchEvent(new KeyboardEvent('keydown', { 'which': 13 }))
        expect(doTheSearchSpy).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger search when search button is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._initializePromise.then(() => {
        document.querySelector('#search-submit svg').dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          })
        )
        expect(doTheSearchSpy).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger search when suggestion tag is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._initializePromise.then(() => {
        document.querySelector('.suggestion').click()
        expect(doTheSearchSpy).toHaveBeenCalled()
        expect(app._keywordField.value).toBe('cf_suggestion_1')
        done()
      })
    })

    it('should trigger search when nav link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          document.querySelector('.page-link').click()
          expect(doTheSearchSpy).toHaveBeenCalledTimes(2)
          done()
        })
      })
    })

    it('should show paginations on first page', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_FIRST_PAGE))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(document.querySelector('.c-pagination__page--previous').dataset.url).toBe('')
          expect(document.querySelector('.c-pagination__page--next').dataset.url).not.toBe('')
          done()
        })
      })
    })

    it('should show paginations on first page', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_LAST_PAGE))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(document.querySelector('.c-pagination__page--previous').dataset.url).not.toBe('')
          expect(document.querySelector('.c-pagination__page--next').dataset.url).toBe('')
          done()
        })
      })
    })

    it('should not show paginations with one page results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_SINGLE_PAGE))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(app._states.pagination.is_paged).toBe(false)
          done()
        })
      })
    })

    it('should show not result message with empty results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_EMPTY))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(document.querySelector('.results-wrapper').textContent).toBe('translation...')
          done()
        })
      })
    })

    it('should open a new ticket when ticket result link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_MULTI_PAGE))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          document.querySelector('.ticket-link').click()
          expect(CLIENT.invoke).toHaveBeenCalledWith('routeTo', 'ticket', '6')
          done()
        })
      })
    })

    it('should compose search terms from form fields', (done) => {
      app._initializePromise.then(() => {
        app._keywordField.value = 'TestKeyword'
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
        done()
      })
    })

    it('should handle search request failure with error description', (done) => {
      app._client.request.mockReturnValueOnce(Promise.reject({responseText: '{"description": "fake error"}'}))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(app._states.isError).toBe(true)
          expect(app._states.error.message).toBe('fake error')
          done()
        })
      })
    })

    it('should handle search request failure with error code', (done) => {
      CLIENT.request.mockReturnValueOnce(Promise.reject({responseText: '{"error": "fakeerrorcode"}'}))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(app._states.isError).toBe(true)
          expect(app._states.error.message).toBe('translation...')
          done()
        })
      })
    })

    it('should handle search request failure with global error message', (done) => {
      CLIENT.request.mockReturnValueOnce(Promise.reject({responseText: '{}'}))
      app._initializePromise.then(() => {
        app._doTheSearch(new CustomEvent('fake')).then(() => {
          expect(app._states.isError).toBe(true)
          expect(app._states.error.message).toBe('translation...')
          done()
        })
      })
    })
  })

  describe('Single Brand, Custom Fields = set, Related tickets = true', () => {
    let app
    beforeEach(() => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_SINGLE))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
    })

    it('should not render brands dropdown', (done) => {
      app._initializePromise.then(() => {
        expect(document.querySelector('#brand-filter')).toBe(null)
        done()
      })
    })

    it('should compose search terms without brands', (done) => {
      app._initializePromise.then(() => {
        app._keywordField.value = 'TestKeyword'
        app._advancedToggle.click()
        expect(app._getSearchParams()).toBe('TestKeyword')
        done()
      })
    })
  })

  describe('Single Brand, no Custom Fields, Related tickets = false', () => {
    let app
    beforeEach(() => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_SINGLE))
        .mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app = new Search(CLIENT, APPDATA_WITHOUT_CF, CONFIG)
    })

    it('should populate search suggestions', (done) => {
      app._initializePromise.then(() => {
        expect(app._states.suggestions.length).toBe(0)
        done()
      })
    })
  })
})
