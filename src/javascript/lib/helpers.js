export function resizeContainer (client, max = Number.POSITIVE_INFINITY) {
  const newHeight = Math.min(document.body.clientHeight, max)
  return client.invoke('resize', { height: newHeight })
}

export function templatingLoop (set, getTemplate, initialValue = '') {
  return set.reduce((accumulator, item, index) => {
    return `${accumulator}${getTemplate(item, index)}`
  }, initialValue)
}

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

export function escapeSpecialChars (str) {
  if (!str || typeof str !== 'string') return ''
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
