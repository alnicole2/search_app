var template = function(args){
  if(!args.searchSuggestions.length){
    return ''
  }
  return (
  `
  ${
    args.searchSuggestions.reduce((accumulator, suggestion) => {
      return `${accumulator}<a class="suggestion" href="#">${suggestion}</a>`
    }, '')
  }
  `
  )
}
  
export default template
