/* eslint-env jest, browser */
import DropdownWithTags from '../src/javascript/lib/dropdown_with_tags'
import {createRangePolyfill} from './polyfill'

if (!document.createRange) {
  createRangePolyfill()
}

const MOCKDATA = [
  {label: 'new', value: 'new', isSelected: false},
  {label: 'open', value: 'open', isSelected: false},
  {label: 'pending', value: 'pending', isSelected: false},
  {label: 'onhold', value: 'hold', isSelected: false},
  {label: 'solved', value: 'solved', isSelected: false},
  {label: 'closed', value: 'closed', isSelected: false}
]

describe('dropdown_with_tags', () => {
  let dropdownObj
  beforeEach(() => {
    document.body.innerHTML = '<section id="dropdown-wrapper"></section>'
    dropdownObj = new DropdownWithTags(
      MOCKDATA,
      document.querySelector('#dropdown-wrapper'),
      'Dropdown Label'
    )
  })

  it('should render label with the text passed in', function () {
    expect(document.querySelector('[for="select-label"]').innerHTML).toBe('Dropdown Label')
  })

  it('should expand options when click on the tags container', function () {
    dropdownObj._tagsContainer.click()
    expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')
  })

  it('should add the tag when an option is clicked', function () {
    dropdownObj._optionElements[2].click()
    expect(dropdownObj._dataset[2].isSelected).toBe(true)
    expect(dropdownObj._optionElements[2].classList.contains('is-checked')).toBe(true)
    expect(document.querySelector('.c-tag-option').dataset.index).toBe('2')
    expect(document.querySelectorAll('.c-tag-option').length).toBe(1)
  })

  it('should deselect an option when a tag is clicked', function () {
    dropdownObj._optionElements[2].click()
    document.querySelector('.c-tag-option[data-index="2"]').click()
    expect(dropdownObj._dataset[2].isSelected).toBe(false)
    expect(dropdownObj._optionElements[2].classList.contains('is-checked')).toBe(false)
    expect(document.querySelectorAll('.c-tag-option').length).toBe(0)
  })

  it('should deselect an option when a tag remove icon is clicked', function () {
    dropdownObj._optionElements[1].click()
    dropdownObj._optionElements[2].click()
    document.querySelector('.c-tag-option[data-index="2"] .c-tag__remove').click()
    expect(dropdownObj._dataset[1].isSelected).toBe(true)
    expect(dropdownObj._dataset[2].isSelected).toBe(false)
    expect(dropdownObj._optionElements[2].classList.contains('is-checked')).toBe(false)
    expect(document.querySelectorAll('.c-tag-option').length).toBe(1)
  })

  it('should collapse options when move focus out of the tags container', function (done) {
    // Click on the tagsContainer should expand the options dropdown
    dropdownObj._tagsContainer.click()
    expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')

    // Move focus to body should collapse the options dropdown
    dropdownObj._tagsContainer.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true
      })
    )
    setTimeout(() => {
      expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('true')
      done()
    }, 10)
  })

  it('should NOT collapse options when move focus to a tag or option', function (done) {
    // Click on the tagsContainer should expand the options dropdown
    dropdownObj._tagsContainer.click()
    expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')

    // Move focus to a tag from an option should not collapse the options dropdown
    dropdownObj._optionElements[2].dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true
      })
    )
    document.querySelector('.c-tag-option').focus()
    setTimeout(() => {
      expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')
      done()
    }, 10)
  })

  it('should NOT collapse options when focus out a tag', function () {
    // Click on the tagsContainer should expand the options dropdown
    dropdownObj._tagsContainer.click()
    expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')

    // Focusout the tag should not collapse the options dropdown
    dropdownObj._optionElements[2].click()
    document.querySelector('.c-tag-option').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true
      })
    )
    expect(dropdownObj._menuElement.getAttribute('aria-hidden')).toBe('false')
  })
})
