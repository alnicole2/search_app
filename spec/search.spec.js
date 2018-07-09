/* eslint-env jest, browser */
import Search from '../src/javascript/modules/search'
import {createRangePolyfill} from './polyfill'
import {
  BRANDS_SINGLE,
  BRANDS_MULTI,
  ASSIGNEES,
  RESULTS_12,
  RESULTS_1,
  RESULTS_0,
  RESULTS_200,
  CLIENT,
  APPDATA_WITH_CF,
  APPDATA_WITHOUT_CF,
  CONFIG
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

    it('should populate search suggestions', () => {
      expect(app._states.suggestions.length).toBe(3)
    })

    it('should hide advanced search options', () => {
      const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
      expect(app._states.showAdvancedOptions).toBe(false)
      expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(false)
    })

    it('should show search options and populate assignees dropdown', (done) => {
      const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper')
      const advancedToggle = document.querySelector('#advanced-field-toggle')
      const fakeEventObject = {
        target: {
          checked: true
        }
      }
      app._client.request.mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app._handleAdvancedFieldsToggle(fakeEventObject).then(() => {
        expect(app._states.showAdvancedOptions).toBe(true)
        expect(advancedOptionsWrapper.classList.contains('u-display-block')).toBe(true)
        expect(app._states.assignees.length).toBe(1)
        expect(app._client.request).toHaveBeenCalledTimes(2)

        advancedToggle.click()
        // Request assignee is only called once at the first time toggled
        expect(app._client.request).toHaveBeenCalledTimes(2)
        done()
      })
    })

    it('should trigger search when keyword field focused and press entry key', () => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_1))
      app._keywordField.dispatchEvent(new KeyboardEvent('keydown', { 'which': 13 }))
      expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
      app._keywordField.dispatchEvent(new KeyboardEvent('keydown', { 'which': 32 }))
      expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
    })

    it('should trigger search when search button is clicked', () => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_1))
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
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_1))
      document.querySelector('.suggestion').click()
      expect(doTheSearchSpy).toHaveBeenCalled()
      expect(app._keywordField.value).toBe('cf_suggestion_1')
    })

    it('should trigger search when nav link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_12))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        const pageLinks = document.querySelectorAll('.page-link')
        // Prev is not clickable as we are on the first page
        pageLinks[0].click()
        expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
        // Page 1 is not clickable as we are on the first page
        pageLinks[1].click()
        expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
        // Page 2 is clickable
        pageLinks[2].click()
        expect(doTheSearchSpy).toHaveBeenCalledTimes(2)
        done()
      })
    })

    it('should handle invalid type of pageIndex passed in to _doTheSearch', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_12))
      app._doTheSearch(new CustomEvent('fake'), {}).then(() => {
        // Prev is not clickable as we are on the first page
        document.querySelector('.page-link').click()
        expect(doTheSearchSpy).toHaveBeenCalledTimes(1)
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
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_12))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(document.querySelector('.c-pagination__page--previous').dataset.index).toBe(undefined)
        expect(document.querySelector('.c-pagination__page--next').dataset.index).toBe('2')
        done()
      })
    })

    it('should show paginations on last page', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_12))
      app._doTheSearch(new CustomEvent('fake'), 3).then(() => {
        expect(document.querySelector('.c-pagination__page--previous').dataset.index).toBe('2')
        expect(document.querySelector('.c-pagination__page--next').dataset.index).toBe(undefined)
        done()
      })
    })

    it('should show paginations on other pages', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_200))
      app._doTheSearch(new CustomEvent('fake'), 4).then(() => {
        expect(document.querySelector('.c-pagination__page--previous').dataset.index).toBe('3')
        expect(document.querySelector('.c-pagination__page--next').dataset.index).toBe('5')
      }).then(() => {
        return app._doTheSearch(new CustomEvent('fake'), 40).then(() => {
          expect(document.querySelector('.c-pagination__page--previous').dataset.index).toBe('39')
          expect(document.querySelector('.c-pagination__page--next').dataset.index).toBe(undefined)
        })
      }).then(() => {
        done()
      })
    })

    it('should not show paginations with one page results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_1))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(app._states.pagination.hasMultiplePages).toBe(false)
        done()
      })
    })

    it('should show result message with empty results', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_0))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        expect(document.querySelector('.results-wrapper').textContent).toBe('translation...')
        done()
      })
    })

    it('should return the correct translation key', () => {
      expect(app._getResultsCountKey(0)).toBe(`search.results_count.zero`)
      expect(app._getResultsCountKey(1)).toBe(`search.results_count.one`)
      expect(app._getResultsCountKey(2)).toBe(`search.results_count.other`)
      expect(() => {
        app._getResultsCountKey(-1)
      }).toThrow()
      expect(() => {
        app._getResultsCountKey('')
      }).toThrow()
    })

    it('should open a new ticket when ticket result link is clicked', (done) => {
      app._client.request.mockReturnValue(Promise.resolve(RESULTS_1))
      app._doTheSearch(new CustomEvent('fake')).then(() => {
        document.querySelector('.ticket-link').click()
        expect(CLIENT.invoke).toHaveBeenCalledWith('routeTo', 'ticket', '1')
        done()
      })
    })

    it('should compose search terms from form fields', (done) => {
      app._keywordField.value = 'TestKeyword'
      expect(app._getSearchParams()).toBe('TestKeyword')

      document.querySelector('#type').value = 'ticket'
      document.querySelector('#type').dispatchEvent(new Event('change'))
      expect(app._getSearchParams()).toBe('TestKeyword type:ticket')

      const fakeEventObject = {
        target: {
          checked: true
        }
      }
      app._client.request.mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app._handleAdvancedFieldsToggle(fakeEventObject).then(() => {
        expect(app._getSearchParams()).toBe('TestKeyword type:ticket brand_id:"360000636152"')

        document.querySelector('.c-menu__item').click()
        expect(app._getSearchParams()).toBe('TestKeyword type:ticket status:new brand_id:"360000636152"')

        document.querySelector('#range').value = 'created'
        document.querySelector('#from').value = '2018-06-01'
        document.querySelector('#to').value = '2018-06-07'
        expect(app._getSearchParams()).toBe('TestKeyword type:ticket status:new created>2018-06-01 created<2018-06-07 brand_id:"360000636152"')

        document.querySelector('#assignee').value = 'TT'
        expect(app._getSearchParams()).toBe('TestKeyword type:ticket status:new created>2018-06-01 created<2018-06-07 assignee:"TT" brand_id:"360000636152"')

        document.querySelector('#brand-filter').value = ''
        expect(app._getSearchParams()).toBe('TestKeyword type:ticket status:new created>2018-06-01 created<2018-06-07 assignee:"TT"')

        document.querySelector('#type').value = 'all'
        document.querySelector('#type').dispatchEvent(new Event('change'))
        expect(app._getSearchParams()).toBe('TestKeyword created>2018-06-01 created<2018-06-07')
        done()
      })
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
      app = new Search(CLIENT, APPDATA_WITH_CF, CONFIG)
      app._initializePromise.then(() => {
        done()
        app._keywordField.value = 'TestKeyword'
      })
    })

    it('should not render brands dropdown', () => {
      expect(document.querySelector('#brand-filter')).toBe(null)
    })

    it('should compose search terms without brands', (done) => {
      const fakeEventObject = {
        target: {
          checked: true
        }
      }
      app._client.request.mockReturnValueOnce(Promise.resolve(ASSIGNEES))
      app._handleAdvancedFieldsToggle(fakeEventObject).then(() => {
        expect(app._getSearchParams()).toBe('TestKeyword')
        done()
      })
    })
  })

  describe('Single Brand, no Custom Fields, Related tickets = false', () => {
    let app
    beforeEach((done) => {
      document.body.innerHTML = '<section data-main><img class="loader" src="dot.gif"/></section>'
      CLIENT.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(BRANDS_SINGLE))
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
