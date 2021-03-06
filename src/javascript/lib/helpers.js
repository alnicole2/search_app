/**
 * Resize App container
 * @param {ZAFClient} client ZAFClient object
 * @param {Number} max max height available to resize to
 * @return {Promise} will resolved after resize
 */
export function resizeContainer (client, max = Number.POSITIVE_INFINITY) {
  const newHeight = Math.min(document.body.clientHeight, max)
  return client.invoke('resize', { height: newHeight })
}

/**
 * Helper to render a dataset using the same template function
 * @param {Array} set dataset
 * @param {Function} getTemplate function to generate template
 * @param {String} initialValue any template string prepended
 * @return {String} final template
 */
export function templatingLoop (set, getTemplate, initialValue = '') {
  return set.reduce((accumulator, item, index) => {
    return `${accumulator}${getTemplate(item, index)}`
  }, initialValue)
}

/**
 * Helper to get all the results from a paginated API request
 * @param {ZAFClient} client ZAFClient object
 * @param {String} url API endpoint
 * @param {String} entityName the entity you want to get from the response, e.g. User api response is like {users:[]}
 * @param {Number} max limit of the max number of requests can be made
 * @param {Number} loadedPageCount counter that count the number of requests have been made
 * @return {Array} array of results, e.g. user records
 */
export async function loopingPaginatedRequest (client, url, entityName, max = Number.POSITIVE_INFINITY, loadedPageCount = 0) {
  let results = []
  if (loadedPageCount < max) {
    loadedPageCount++
    let res = await client.request({
      url: url,
      cors: true
    })
    Array.isArray(res[entityName]) && results.push(...res[entityName])
    if (res.next_page) {
      results.push(...(await loopingPaginatedRequest(client, res.next_page, entityName, max, loadedPageCount)))
    }
  }
  return results
}

/**
 * Helper to escape unsafe characters in HTML, including &, <, >, ", ', `, =
 * @param {String} str String to be escaped
 * @return {String} escaped string
 */
export function escapeSpecialChars (str) {
  if (typeof str !== 'string') throw new TypeError('escapeSpecialChars function expects input in type String')
  const escape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return str.replace(/[&<>"'`=]/g, function (m) { return escape[m] })
}

/**
 * Higher order function to defer the execution of the passed in function
 * @param {Function} fn function to be deferred
 * @param {Number} delay The time to be delayed, in milliseconds
 * @return {Function} the new deferred function who returns a promise which will be resolved to the oringinal function's return value
 */
export function defer (fn, delay) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(fn.call(this, ...args))
      }, delay)
    })
  }
}
