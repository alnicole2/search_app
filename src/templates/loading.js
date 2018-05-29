import I18n from '../javascript/lib/i18n.js'
var template = function(args){
  return (
  `
  <div class="loading">${I18n.t("global.loading")}</div>
  `
  )
}
  
export default template
