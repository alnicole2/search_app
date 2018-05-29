import I18n from '../javascript/lib/i18n.js'
let getTicketMarkup = (o) => {
  return (
    `
    <tr class="_tooltip" data-title="${o.description}">
      <td><a href="#/tickets/${o.id}"><b>#${o.id}</b> ${o.subject}</a></td>
      <td class="type">${I18n.t("search.result_type.ticket")}</td>
    </tr>
    `
  )        
}

let getArticleMarkup = (o) => {
  return (
    `
    <tr>
      <td><a href="${o.html_url}" target="_blank">${o.name}</a></td>
      <td class="type">${I18n.t("search.result_type.article")}</td>
    </tr>
    `
  )        
}


let getUserMarkup = (o) => {
  return (
    `
    <tr>
      <td><a href="#/users/${o.id}">${o.name}</a></td>
      <td class="type">${I18n.t("search.result_type.user")}</td>
    </tr>
    `
  )        
}

let getOrganizationMarkup = (o) => {
  return (
    `
    <tr>
      <td><a href="#/organizations/${o.id}/tickets">${o.name}</a></td>
      <td class="type">${I18n.t("search.result_type.organization")}</td>
    </tr>
    `
  )  
}

let getGroupMarkup = (o) => {
  return (
    `
    <tr>
      <td><a href="#/admin/people">${o.name}</a></td>
      <td class="type">${I18n.t("search.result_type.group")}</td>
    </tr>
    `
  )  
}

let getTopicMarkup = (o) => {
  return (
    `
    <tr>
      <td><a href="/entries/${o.id}" target="_blank">${o.title}</a></td>
      <td class="type">${I18n.t("search.result_type.topic")}</td>
    </tr>
    `
  )  
}

let getPaginationMarkup = (args) => {
  if(!args.is_paged){
    return ''
  }
  return (
    `
    <div class="search-results-pagination clearfix">
      <p class="paging-counter">Page ${args.current_page} of ${args.page_count}</p>
      ${
        args.previous_page 
        ? 
        `<a data-url="${args.previous_page}" href="#" class="left page-link">&larr; ${I18n.t("search.previous")}</a>`
        :
        ''
      }
      ${
        args.next_page
        ?
        `<a data-url="${args.next_page}" href="#" class="right page-link">${I18n.t("search.next")} &rarr;</a>`
        :
        ''
      }
    </div>
    `
  )
}

var template = function(args){
  if(!args.results.length){
    return I18n.t("global.no_results")
  }
  return (
  `
  <p class="count"><strong>${args.count}</strong></p>
  <table class="table table-condensed">
    <tbody>
      ${
        args.results.reduce((accumulator, result) => {
          let html = ''
          if(result.is_ticket){
            html = getTicketMarkup(result)
          }
          else if(result.is_article){
            html = getArticleMarkup(result)
          }
          else if(result.is_user){
            html = getUserMarkup(result)
          }
          else if(result.is_organization){
            html = getOrganizationMarkup(result)
          }
          else if(result.is_group){
            html = getGroupMarkup(result)
          }
          else if(result.is_topic){
            html = getTopicMarkup(result)
          }
          return `${accumulator}${html}`
        }, '')
      }
    </tbody>
  </table>
  ${getPaginationMarkup(args)}
  `
  )
}
  
export default template