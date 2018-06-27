import I18n from '../javascript/lib/i18n.js'
import {templatingLoop as loop, escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
const getTicketMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell">
        <div class=" u-position-relative">
          <a href class="ticket-link" data-id="${o.id}"><b>#${o.id}</b> ${escape(o.subject)}</a>
          <div class="c-tooltip c-tooltip--large c-arrow c-arrow--b"><small>${escape(o.description)}</small></div>
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
      <td class="c-table__row__cell"><a href="${o.html_url}" target="_blank">${escape(o.name)}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.article')}</td>
    </tr>
    `
  )
}

const getUserMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/users/${o.id}">${escape(o.name)}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.user')}</td>
    </tr>
    `
  )
}

const getOrganizationMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/organizations/${o.id}/tickets">${escape(o.name)}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.organization')}</td>
    </tr>
    `
  )
}

const getGroupMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="#/admin/people">${escape(o.name)}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.group')}</td>
    </tr>
    `
  )
}

const getTopicMarkup = (o) => {
  return (
    `
    <tr class="c-table__row">
      <td class="c-table__row__cell"><a href="/entries/${o.id}" target="_blank">${escape(o.title)}</a></td>
      <td class="type c-table__row__cell u-ta-right">${I18n.t('search.result_type.topic')}</td>
    </tr>
    `
  )
}

const getPaginationMarkup = (args) => {
  let html = ''
  if (args.pagination.hasMultiplePages) {
    const pageCount = args.pagination.page_count
    const current = args.currentPage
    const prevLinkDataIndex = current > 1 ? `data-index="${current - 1}"` : ''
    const prevLinkAriaHidden = current > 1 ? 'false' : 'true'
    const nextLinkDataIndex = current < pageCount ? `data-index="${current + 1}"` : ''
    const nextLinkAriaHidden = current < pageCount ? 'false' : 'true'
    html = `
      <ul class="c-pagination" role="navigation">
        <li class="c-pagination__page c-pagination__page--previous page-link" ${prevLinkDataIndex} aria-hidden="${prevLinkAriaHidden}">previous</li>
        ${getPages(current, pageCount)}
        <li class="c-pagination__page c-pagination__page--next page-link" ${nextLinkDataIndex} aria-hidden="${nextLinkAriaHidden}">next</li>
      </ul>
    `
  }
  return html
}

const getPages = (current, pageCount) => {
  // In practice, 7 is the min number that works for the current design => 1,...,4,5,6,...,10
  const maxNumberOfLinks = 7
  // logic to make sure as many pages visible as possible(up to maxNumberOfLinks)
  let offset = Math.max(maxNumberOfLinks - 2 - (current - 1), maxNumberOfLinks - 2 - (pageCount - current), 2)
  let pages = ''
  for (let i = 1; i <= pageCount; i++) {
    // display page link if
    // - total page count is smaller than maxNumberOfLinks
    // - first page
    // - last page
    // - pages within the range of current -/+ offset
    if (pageCount <= maxNumberOfLinks || i === 1 || i === pageCount || Math.abs(current - i) < offset) {
      pages += getPageLinkMarkup(current, i)
    } else {
      let from = i
      if (i < current) {
        i = current - offset
      } else {
        i = pageCount - 1
      }
      if (from === i) pages += getPageLinkMarkup(current, i)
      else pages += getGapMarkup(from, i)
    }
  }
  return pages
}

const getPageLinkMarkup = (current, index) => {
  return `<li class="c-pagination__page page-link" ${current === index ? 'aria-current="true"' : `data-index="${index}"`}>${index}</li>`
}

const getGapMarkup = (from, to) => {
  return `<li class="c-pagination__page c-pagination__page--gap">${from}-${to}</li>`
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
      <table class="c-table u-mb-sm">
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
