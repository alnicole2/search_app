import I18n from '../javascript/lib/i18n.js'
var template = function(args){
  return (
  `
  <div class="search-container">
    <form action="" class="search">
      <div class="options">
        <div class="left">
          <span>${I18n.t("search.search")}</span>
          <select name="type" id="type">
            <option value="all">${I18n.t("search.type.all")}</option>
            <option value="ticket">${I18n.t("search.type.tickets")}</option>
            <option value="article">${I18n.t("search.type.articles")}</option>
            <option value="user">${I18n.t("search.type.people")}</option>
            <option value="organization">${I18n.t("search.type.organizations")}</option>
            <option value="entry">${I18n.t("search.type.topics")}</option>
          </select>
        </div>
        <div class="toggle-advanced">
          <a class="advanced" href="#">${I18n.t("search.options.advanced")}</a>
          <a class="basic" href="#">${I18n.t("search.options.basic")}</a>
        </div>
      </div>

      <div class="advanced-options-wrapper">
        <div class="advanced-options">
          <div class="advanced-option">
            <select name="filter" id="filter">
              <option value="">-</option>
              <option value="status">${I18n.t("search.filter.status")}</option>
            </select>
            <select name="condition" id="condition">
              <option value="">-</option>
              <option value=":">${I18n.t("search.condition.equal")}</option>
              <option value=">">${I18n.t("search.condition.greater")}}</option>
              <option value="<">${I18n.t("search.condition.less")}</option>
            </select>
            <select name="value" id="value">
              <option value="">-</option>
              <option value="new">${I18n.t("search.value.new")}</option>
              <option value="open">${I18n.t("search.value.open")}</option>
              <option value="pending">${I18n.t("search.value.pending")}</option>
              <option value="solved">${I18n.t("search.value.solved")}</option>
              <option value="closed">${I18n.t("search.value.closed")}</option>
            </select>
          </div>

          <div class="advanced-option">
            <select name="range" id="range">
              <option value="">-</option>
              <option value="created">${I18n.t("search.filter.created")}</option>
              <option value="updated">${I18n.t("search.filter.updated")}</option>
            </select>
            <input type="text" id="from" class="date" placeholder="YYYY-MM-DD">
            -
            <input type="text" id="to" class="date" placeholder="YYYY-MM-DD">
          </div>

          <div class="advanced-option">
            <label class="assignee-label" for="assignee">${I18n.t("search.user.assignee")}</label>
            <select name="assignee" id="assignee">
              <option value="">${I18n.t("search.user.loading")}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="search-bar">
        <div class="search-wrapper input-append">
          <input class="search-box" type="text">
          <button id="search-submit" class="btn" type="button">search</button>
        </div>
        <div class="suggestions"></div>
      </div>
    </form>
  </div>
  <div class="results-wrapper">
    <div class="searching">${I18n.t("global.searching")}</div>
    <div class="results">
    </div>
  </div>
  `
  )
}
  
export default template
