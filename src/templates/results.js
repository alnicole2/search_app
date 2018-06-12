import I18n from '../javascript/lib/i18n.js'
import {templatingLoop as loop} from '../javascript/lib/helpers.js'
const getTicketMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell">
        <div class=" u-position-relative">
          <a href class="ticket-link" data-id="${o.id}"><b>#${o.id}</b> ${o.subject}</a>
          <div class="c-tooltip c-tooltip--large c-arrow c-arrow--b"><small>${o.description}</small></div>
        </div>
      </td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.ticket')}</td>
    </tr>
    `
  )
}

const getArticleMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="${o.html_url}" target="_blank">${o.name}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.article')}</td>
    </tr>
    `
  )
}

const getUserMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/users/${o.id}">${o.name}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.user')}</td>
    </tr>
    `
  )
}

const getOrganizationMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/organizations/${o.id}/tickets">${o.name}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.organization')}</td>
    </tr>
    `
  )
}

const getGroupMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/admin/people">${o.name}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.group')}</td>
    </tr>
    `
  )
}

const getTopicMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="/entries/${o.id}" target="_blank">${o.title}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.topic')}</td>
    </tr>
    `
  )
}

const getPaginationMarkup = (args) => {
  return (
    args.pagination.is_paged
      ? `
    <ul class="c-pagination">
      <li class="c-pagination__page c-pagination__page--previous page-link" data-url="${args.pagination.previous_page || ''}">previous</li>
      <li class="c-pagination__page c-pagination__page--next page-link" data-url="${args.pagination.next_page || ''}">next</li>
    </ul>
    `
      : ''
  )
}

const getErrorMarkup = (args) => {
  return (
    `
    <div class="c-callout c-callout--error">
      <strong class="c-callout__title"><span dir="ltr">${args.error.title}</span></strong>
      <p class="c-callout__paragraph">${args.error.message}</p>
    </div>
    `
  )
}

const getResultMarkup = (result) => {
  switch (result.result_type) {
    case 'ticket': return getTicketMarkup(result)
    case 'article': return getArticleMarkup(result)
    case 'user': return getUserMarkup(result)
    case 'organization': return getOrganizationMarkup(result)
    case 'group': return getGroupMarkup(result)
    case 'topic': return getTopicMarkup(result)
    default: return ''
  }
}

const getLoaderMarkup = (args) => {
  return `<div class="loader"><img src="dot.gif"/> ${I18n.t('global.searching')}</div>`
}

const getResultsMarkup = (args) => {
  return (
    `
      <p class="count"><strong>${args.pagination.count}</strong></p>
      <table class="c-table">
        <tbody>
          ${loop(args.results, getResultMarkup)}
        </tbody>
      </table>
      ${getPaginationMarkup(args)}
    `
  )
}

export default function template (args) {
  let resultsHTML = ''
  if (args.isLoading) resultsHTML = getLoaderMarkup(args)
  else if (args.isError) resultsHTML = getErrorMarkup(args)
  else if (!args.results.length) resultsHTML = I18n.t('global.no_results')
  else resultsHTML = getResultsMarkup(args)
  return `<div class="results-wrapper">${resultsHTML}</div>`
}
