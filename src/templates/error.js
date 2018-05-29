var template = function(args){
  return (
  `
  <div class="alert">
    <h4>${args.title}</h4>
    <p>${args.message}</p>
  </div>
  `
  )
}

export default template