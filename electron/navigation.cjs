// 导航判断只依赖 URL，不引用 Electron，便于在 Node 中单独测试。
const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

function parseUrl(value) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

// 应用入口本身（开发服务器页面或打包后的 index.html）允许重新加载，忽略锚点和查询参数。
function isAppEntryUrl(targetUrl, appEntryUrl) {
  const target = parseUrl(targetUrl)
  const entry = parseUrl(appEntryUrl)
  if (!target || !entry) return false

  return target.origin === entry.origin && target.pathname === entry.pathname
}

function isExternalUrl(value) {
  const url = parseUrl(value)
  return Boolean(url && EXTERNAL_PROTOCOLS.has(url.protocol))
}

module.exports = { EXTERNAL_PROTOCOLS, isAppEntryUrl, isExternalUrl }
