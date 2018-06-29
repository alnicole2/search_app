import {templatingLoop as loop, escapeSpecialChars as escape} from './helpers.js'
class DropdownWithTags {
  /**
   * Constructor
   * @param {Array} dataset array of option objects [{label, value[, isSelected]}]
   * @param {HTMLElement} container parentNode which the dropdown is appended to
   * @param {String} label Label of the dropdown
   */
  constructor (dataset, container, label) {
    this._moduleContainer = container
    this._dataset = dataset
    this._label = label
    const fragment = document.createRange().createContextualFragment(this.dropdownMarkup)
    this._optionElements = fragment.querySelectorAll('.c-menu__item')
    this._tagsContainer = fragment.querySelector('#select-label')
    this._menuElement = fragment.querySelector('.c-menu')
    this._moduleContainer.appendChild(fragment)
    this._renderTags()
    this._init()
  }

  /**
   * Getter dropdown markup
   * @return {String} HTML string
   */
  get dropdownMarkup () {
    return `
      <div class="c-txt">
        <label class="c-txt__label" for="select-label">${this._label}</label>
        <div class="c-txt__input c-txt__input--tag c-txt__input--select" id="select-label" tabindex="0"></div>
      </div>
      <div role="menu" aria-hidden="true" class="c-menu c-menu--down">
        ${this.optionsMarkup}             
      </div>
    `
  }

  /**
   * Getter dropdown options markup
   * @return {String} HTML string
   */
  get optionsMarkup () {
    return loop(
      this._dataset,
      (option, index) => `<a href data-index="${index}" class="c-menu__item ${option.isSelected ? 'is-checked' : ''}">${escape(option.label)}</a>`
    )
  }

  /**
   * Render tags markup on the page
   */
  _renderTags () {
    const html = loop(
      this._dataset,
      (option, index) => {
        if (option.isSelected) {
          return `
            <a data-index="${index}" class="c-tag c-tag-option" href>
              <span dir="ltr">${escape(option.label)}</span>
              <span class="c-tag__remove"></span>
            </a>
          `
        }
        return ''
      }
    )
    this._tagsContainer.innerHTML = html
  }

  /**
   * Initialize module, events binding
   */
  _init () {
    this._moduleContainer.addEventListener('click', this._clickHandlerDispatcher.bind(this))
    this._tagsContainer.addEventListener('focus', this._expandDropdown.bind(this))
    this._moduleContainer.addEventListener('focusout', this._focusoutHandlerDispatcher.bind(this))
  }

  /**
   * Handling click events delegation
   * @param {Event} event
   */
  _clickHandlerDispatcher (event) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.target
    if (target === this._tagsContainer) this._expandDropdown()
    else if (target.classList.contains('c-menu__item') && !target.classList.contains('is-checked')) this._handleSelectOption(target)
    else if (target.parentNode.classList.contains('c-tag-option')) this._handleDeselectOption(target.parentNode)
    else if (target.classList.contains('c-tag')) this._handleDeselectOption(target)
  }

  /**
   * Handling focusout events delegation
   * @param {Event} event
   */
  _focusoutHandlerDispatcher (event) {
    const target = event.target
    if (target === this._tagsContainer) this._handleCollapseDropdown()
    else if (target.classList.contains('c-menu__item') && target.dataset.index) this._handleCollapseDropdown()
  }

  /**
   * Expand dropdown options
   */
  _expandDropdown () {
    this._menuElement.setAttribute('aria-hidden', 'false')
  }

  /**
   * Collapse dropdown options
   */
  _collapseDropdown () {
    this._menuElement.setAttribute('aria-hidden', 'true')
  }

  /**
   * Handling the timing and logic of dropdown options collapse
   * Only trigger the collapse when
   * - another element receives the focus event
   * - the new focused element is not a option tag or an option
   * @param {FocusEvent} blur
   */
  _handleCollapseDropdown () {
    // set timeout to wait for next element to receive focus, ref:https://www.w3.org/TR/uievents/#events-focusevent-event-order
    setTimeout(() => {
      const nextFocusElement = document.activeElement
      if (!nextFocusElement.classList.contains('c-tag-option') && !nextFocusElement.classList.contains('c-menu__item')) {
        this._collapseDropdown()
      }
    }, 0)
  }

  /**
   * Option select handler
   * @param {HTMLElement} selected option element
   */
  _handleSelectOption (target) {
    const index = target.dataset.index
    target.classList.add('is-checked')
    this._dataset[index].isSelected = true
    this._renderTags()
  }

  /**
   * Option deselect handler
   * @param {HTMLElement} deselected tag element
   */
  _handleDeselectOption (target) {
    const index = target.dataset.index
    this._optionElements[index].classList.remove('is-checked')
    this._dataset[index].isSelected = false
    this._renderTags()
    this._collapseDropdown()
  }

  /**
   * Getter array of selected options' values
   * @return {Array}
   */
  get selectedValues () {
    return this._dataset.reduce((accumulator, option) => {
      if (option.isSelected) {
        accumulator.push(option.value)
      }
      return accumulator
    }, [])
  }
}
export default DropdownWithTags
