// jsdom createRange polyfill
export const createRangePolyfill = () => {
  document.createRange = () => ({
    createContextualFragment: (templateString) => {
      let template = document.createElement('template')
      template.innerHTML = templateString
      return template.content
    }
  })
}
