var template = function(args){
  return (
  `
  <div class="alert">
    <h4>${args.error.title}</h4>
    <p>${args.error.message}</p>
  </div>
  `
  )
}

export default template