import { buildRichClipboardPayload } from './clipboard'
import katexCss from 'virtual:format-hub-katex-css'

const FORMULA_IMAGE_SCALE = 3
const FORMULA_IMAGE_PADDING = 4
const IMAGE_LOAD_TIMEOUT_MS = 10000

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => reject(new Error('公式图片生成超时，请重试。')), IMAGE_LOAD_TIMEOUT_MS)
    image.onload = () => { clearTimeout(timer); resolve(image) }
    image.onerror = () => { clearTimeout(timer); reject(new Error('公式图片生成失败，请重试。')) }
    image.src = source
  })
}

async function formulaToImage(formula) {
  const clone = formula.cloneNode(true)
  for (const element of [clone, clone.querySelector('.katex-html')].filter(Boolean)) {
    Object.assign(element.style, {
      display: 'inline-block', width: 'auto', height: 'auto',
      inlineSize: 'auto', blockSize: 'auto', minWidth: '0', maxWidth: 'none', textAlign: 'left',
    })
  }
  clone.style.margin = '0'
  clone.style.color = '#111111'
  clone.querySelectorAll('*').forEach(node => { node.style.color = '#111111' })
  const wrapper = document.createElement('div')
  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  wrapper.style.cssText = `background:#ffffff;padding:${FORMULA_IMAGE_PADDING}px;display:inline-block;white-space:nowrap;`
  const style = document.createElement('style')
  style.textContent = katexCss
  wrapper.append(style, clone)
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-100000px'
  document.body.append(wrapper)
  const rect = wrapper.getBoundingClientRect()
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  wrapper.remove()
  wrapper.style.removeProperty('position')
  wrapper.style.removeProperty('left')
  if (width <= FORMULA_IMAGE_PADDING * 2 || height <= FORMULA_IMAGE_PADDING * 2) {
    throw new Error('无法测量公式尺寸，请等待排版完成后重试。')
  }
  const serialized = new XMLSerializer().serializeToString(wrapper)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const rendered = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = width * FORMULA_IMAGE_SCALE
  canvas.height = height * FORMULA_IMAGE_SCALE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前环境无法生成公式图片。')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(rendered, 0, 0, canvas.width, canvas.height)
  const image = document.createElement('img')
  image.src = canvas.toDataURL('image/png')
  image.alt = formula.getAttribute('data-formula') || formula.textContent || '数学公式'
  image.setAttribute('data-w', String(canvas.width))
  image.setAttribute('data-ratio', String(height / width))
  image.style.cssText = `display:inline-block;width:${width}px;max-width:100%;height:auto;vertical-align:middle;background-color:#ffffff;`
  return image
}

// 两个公众号出口共享同一快照。公式图片只影响公众号输出。
export async function buildWechatPayload(rootElement) {
  const payload = buildRichClipboardPayload(rootElement)
  const template = document.createElement('template')
  template.innerHTML = payload.html
  const root = template.content.firstElementChild
  if (!root.querySelector('.katex')) return payload

  const measuringHost = document.createElement('div')
  measuringHost.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;width:640px;'
  measuringHost.append(root)
  document.body.append(measuringHost)
  try {
    await document.fonts.ready
    for (const formula of Array.from(root.querySelectorAll('.katex'))) {
      const image = await formulaToImage(formula)
      formula.replaceWith(image)
    }
    return { html: root.outerHTML, text: payload.text }
  } finally {
    measuringHost.remove()
  }
}

export function buildWechatDocument(payload, title = '微信公众号文章') {
  const titleNode = document.createElement('span')
  titleNode.textContent = title
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titleNode.innerHTML}</title></head><body style="margin:0">${payload.html}</body></html>`
}
