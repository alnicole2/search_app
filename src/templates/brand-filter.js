

import I18n from '../javascript/lib/i18n.js'
var template = function(args){
  return (
  `
  <div class="advanced-option">
    <label class="brand-label" for="brand">${I18n.t("brand_filter.brand")}</label>
    <select class="brand-filter" name="brand" data-zd-type="select_menu">
      <option value="">${I18n.t("brand_filter.all_brands")}</option>
      ${
        args.options.reduce((accumulator, option) => {
          return `${accumulator}<option value='${option.value}'>${option.label}</option>`
        }, '')
      }
    </select>
  </div>
  `
  )
}
  
export default template
