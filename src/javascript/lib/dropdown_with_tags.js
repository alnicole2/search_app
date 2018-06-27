import I18n from './i18n.js'
import {templatingLoop as loop, escapeSpecialChars as escape} from './helpers.js'
class TagContentDropdown {
  constructor (dataset, container, label) {
    this._appContainer = container
    this._dataset = dataset
    this._html = `
      <div class="c-txt">
        <label class="c-txt__label" for="select-label">${label}</label>
        <div class="c-txt__input c-txt__input--tag c-txt__input--select" id="select-label" tabindex="0"></div>
      </div>
      <div role="menu" aria-hidden="true" class="c-menu c-menu--down">
        ${loop(
    dataset,
    (option, index) => `<a href data-index="${index}" tabindex="0" class="c-menu__item ${option.isSelected ? 'is-checked' : ''}">${escape(option.label)}</a>`
  )}             
      </div>
    `
    const fragment = document.createRange().createContextualFragment(this._html)
    this._optionElements = fragment.querySelectorAll('.c-menu__item')
    this._tagsContainer = fragment.querySelector('#select-label')
    this._menuElement = fragment.querySelector('.c-menu')
    this._appContainer.appendChild(fragment)
    this._renderTags()
    this._init()
  }
  _renderTags () {
    const html = loop(
      this._dataset,
      (option, index) => option.isSelected
        ? `
          <a data-index="${index}" class="c-tag" href>
            <span dir="ltr">${escape(option.label)}</span>
            <span class="c-tag__remove"></span>
          </a>
        `
        : ''
    )
    this._tagsContainer.innerHTML = html
  }
  _init () {
    this._appContainer.addEventListener('click', this._clickHandlerDispatcher.bind(this))
    this._tagsContainer.addEventListener('focus', this._expandDropdown.bind(this))
    this._tagsContainer.addEventListener('blur', this._handleCollapseDropdown.bind(this))
    this._optionElements.forEach((el) => {
      el.addEventListener('blur', this._handleCollapseDropdown.bind(this))
    })
  }
  _clickHandlerDispatcher (event) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.target
    if (target === this._tagsContainer) this._expandDropdown()
    else if (target.classList.contains('c-menu__item') && !target.classList.contains('is-checked')) this._handleSelectOption(target)
    else if (target.classList.contains('c-tag')) this._handleDeselectOption(target)
    else if (target.classList.contains('c-tag__remove')) this._handleDeselectOption(target.parentNode)
  }
  _expandDropdown () {
    this._menuElement.setAttribute('aria-hidden', 'false')
  }
  _collapseDropdown () {
    this._menuElement.setAttribute('aria-hidden', 'true')
  }
  _handleCollapseDropdown (event) {
    // set timeout to wait for next element to receive focus, ref:https://www.w3.org/TR/uievents/#events-focusevent-event-order
    setTimeout(() => {
      const nextFocusElement = document.activeElement
      if (!nextFocusElement.classList.contains('c-tag') && !nextFocusElement.classList.contains('c-menu__item')) {
        this._collapseDropdown()
      } 
    },0)
  }
  _handleSelectOption (target) {
    const index = target.dataset.index
    target.classList.add('is-checked')
    this._dataset[index].isSelected = true
    this._renderTags()
  }
  _handleDeselectOption (target) {
    const index = target.dataset.index
    this._optionElements[index].classList.remove('is-checked')
    this._collapseDropdown()
    this._dataset[index].isSelected = false
    this._renderTags()
  }
  getValues () {
    return this._dataset.reduce((accumulator, option) => {
      if(option.isSelected){
        accumulator.push(option.value)
      }
      return accumulator
    },[])
  }
}
export default TagContentDropdown
