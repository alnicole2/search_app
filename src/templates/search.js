import I18n from '../javascript/lib/i18n.js'
import {templatingLoop as loop, escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
const getSuggestionsListMarkup = (suggestions) => {
  return loop(
    suggestions,
    suggestion => `<a href class="c-tag u-mr-xs suggestion">${escape(suggestion)}</a>`
  )
}

const getBrandsDropdownMarkup = (args) => {
  if (args.hasMultiplebBrands) {
    return `
      <div class="advanced-option">
        <label class="c-txt__label c-txt__label--sm" for="brand-filter">${I18n.t('brand_filter.brand')}</label>
        <select name="brand-filter" id="brand-filter" class="c-txt__input c-txt__input--select c-txt__input--sm">
          <option value="">${I18n.t('brand_filter.all_brands')}</option>
          ${getBrandsOptionsMarkup(args.brands)}
        </select>
      </div>
    `
  }
}

const getBrandsOptionsMarkup = (brands) => {
  return loop(
    brands,
    brand => `<option value='${brand.value}' ${brand.selected ? 'selected' : ''}>${escape(brand.label)}</option>`
  )
}

export default function (args) {
  return (
    `
  <div class="search-app">
    <form action="" class="search" novalidate>
      <fieldset class="u-mb-sm">
        <label class="c-txt__label c-txt__label--sm" for="type">${I18n.t('search.search')}</label>
        <select name="type" id="type" class="c-txt__input c-txt__input--select c-txt__input--sm">
          <option value="all">${I18n.t('search.type.all')}</option>
          <option value="ticket">${I18n.t('search.type.tickets')}</option>
          <option value="article">${I18n.t('search.type.articles')}</option>
          <option value="user">${I18n.t('search.type.people')}</option>
          <option value="organization">${I18n.t('search.type.organizations')}</option>
          <option value="entry">${I18n.t('search.type.topics')}</option>
        </select>
      </fieldset>
      <fieldset class="u-mb-sm">
        <div class="c-txt__input c-txt__input--sm u-display-flex">
          <input class="c-txt__input c-txt__input--bare c-txt__input--sm search-box" placeholder="${I18n.t('search.term.placeholder')}" type="text" autocomplete="off" required>
          <button type="submit" id="search-submit" class="c-btn c-btn--icon c-btn--sm c-btn--basic c-btn--muted">
            <svg viewBox="0 0 16 16" id="zd-svg-icon-16-search-stroke" width="16" height="16"><circle cx="6" cy="6" r="5.5" fill="none" stroke="currentColor"></circle><path stroke="currentColor" stroke-linecap="round" d="M15 15l-5-5"></path></svg>
          </button>
        </div>
      </fieldset>
      <fieldset class="u-mb-sm suggestions">
        ${I18n.t('search.suggestions')}
        ${getSuggestionsListMarkup(args.suggestions)}
      </fieldset>
      <fieldset class="u-mb-sm u-ta-right c-chk">
        <input class="c-chk__input" id="advanced-field-toggle" type="checkbox">
        <label class="c-chk__label__unchecked" for="advanced-field-toggle">${I18n.t('search.options.advanced')}</label>
        <label class="c-chk__label__checked" for="advanced-field-toggle">${I18n.t('search.options.basic')}</label>
      </fieldset>
      <div class="advanced-options-wrapper">
        <fieldset class="u-mb-sm u-position-relative ticket-only" id="ticket-status"></fieldset>
        <fieldset class="u-mb-sm u-pb-sm date-range">
          <label class="c-txt__label c-txt__label--sm" for="range">${I18n.t('search.filter.date_range')}</label>
          <select name="range" id="range" class="c-txt__input c-txt__input--select c-txt__input--sm u-mb-sm">
            <option value="">${I18n.t('search.filter.none')}</option>
            <option value="created">${I18n.t('search.filter.created')}</option>
            <option value="updated">${I18n.t('search.filter.updated')}</option>
          </select>
          <div class="row date-range--fields">
            <div class="col">
              <label class="c-txt__label c-txt__label--sm" for="from">${I18n.t('search.filter.date_start')}</label>
              <input type="text" id="from" class="c-txt__input c-txt__input--sm" placeholder="YYYY-MM-DD" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}">
            </div>
            <div class="col">
              <label class="c-txt__label c-txt__label--sm" for="to">${I18n.t('search.filter.date_end')}</label>
              <input type="text" id="to" class="c-txt__input c-txt__input--sm" placeholder="YYYY-MM-DD" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}">
            </div>
          </div>
          <small class="c-txt__message c-txt__message--error date-range--error u-mv-sm">${I18n.t('search.filter.date_error')}</small>
        </fieldset>
        <fieldset class="u-mb-sm ticket-only">
          <label class="c-txt__label c-txt__label--sm" for="assignee">${I18n.t('search.user.assignee')}</label>
          <span id="assignee" class="placeholder"></span>
        </fieldset>
        <fieldset class="u-mb-sm">
          ${getBrandsDropdownMarkup(args)}
        </fieldset>
      </div>
    </form>
    <div class="results-wrapper"></div>
  </div>
  `
  )
}
