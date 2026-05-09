export const DEFAULT_PDF_PAGE_SIZE = 'A4'
export const DEFAULT_PDF_FONT_KEY = 'systemSans'
export const DEFAULT_PDF_HEADER_TEMPLATE = '{title}'
export const DEFAULT_PDF_FOOTER_TEMPLATE = '第 {pageNumber} / {totalPages} 页'
export const DEFAULT_PDF_MARGIN_INPUTS = {
  top: '18',
  right: '16',
  bottom: '18',
  left: '16',
}
export const DEFAULT_PDF_MARGIN_MM = {
  top: 18,
  right: 16,
  bottom: 18,
  left: 16,
}
export const PDF_PAGE_SIZE_OPTIONS = [
  { value: 'A4', label: 'A4' },
  { value: 'Letter', label: 'Letter' },
]
export const PDF_FONT_OPTIONS = [
  {
    key: 'systemSans',
    label: '系统黑体',
    value: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
  },
  {
    key: 'serifCn',
    label: '中文宋体',
    value: '"Noto Serif SC", "Songti SC", "SimSun", "Times New Roman", serif',
  },
  {
    key: 'sansCn',
    label: '中文雅黑',
    value: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif',
  },
]
export const PDF_MARGIN_FIELDS = [
  { key: 'top', label: '上' },
  { key: 'right', label: '右' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' },
]

export function sanitizeNonNegativeDecimalInput(value) {
  const numeric = value.replace(/[^\d.]/g, '')
  const [integerPart, ...fractionParts] = numeric.split('.')

  if (fractionParts.length === 0) return integerPart

  return `${integerPart}.${fractionParts.join('')}`
}

export function parseNonNegativeDecimalInput(value, fallback) {
  if (!value) return fallback

  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback

  return parsed
}

function cleanMarkdownTitle(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractMarkdownTitle(value) {
  const lines = value.split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^\s{0,3}#\s+(.+?)\s*#*\s*$/)
    if (!match) continue

    const title = cleanMarkdownTitle(match[1])
    if (title) return title
  }

  return '微信公众号文章'
}

export function resolvePdfFontFamily(fontKey) {
  return PDF_FONT_OPTIONS.find((font) => font.key === fontKey)?.value || PDF_FONT_OPTIONS[0].value
}
