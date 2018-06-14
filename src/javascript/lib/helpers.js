export function resizeContainer (client, max = Number.POSITIVE_INFINITY) {
  const newHeight = Math.min(document.body.clientHeight, max)
  return client.invoke('resize', { height: newHeight })
}

export function templatingLoop (set, getTemplate, initialValue = '') {
  return set.reduce((accumulator, item) => {
    return `${accumulator}${getTemplate(item)}`
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
  const escape = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#x27;',
	  '`': '&#x60;',
	  '=': '&#x3D;'
  };
  return str.replace(/[&<>"'`=]/g, function(m) { return escape[m]; });
}
