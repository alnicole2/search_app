export function resizeContainer (client, max = Number.POSITIVE_INFINITY) {
  const newHeight = Math.min(document.body.clientHeight, max)
  return client.invoke('resize', { height: newHeight })
}

export function templatingLoop (set, getTemplate, initialValue = '') {
  return set.reduce((accumulator, item) => {
    return `${accumulator}${getTemplate(item)}`
  }, initialValue)
}
