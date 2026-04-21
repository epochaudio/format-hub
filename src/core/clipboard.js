const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const INLINE_STYLE_PROPERTIES = [
  'display',
  'max-width',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-radius',
  'border-collapse',
  'border-spacing',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'box-shadow',
  'box-sizing',
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'text-decoration-color',
  'text-decoration-line',
  'text-decoration-style',
  'text-indent',
  'text-transform',
  'vertical-align',
  'white-space',
  'word-break',
  'overflow-wrap',
  'list-style-type',
  'list-style-position',
  'list-style-image',
  'overflow',
  'overflow-x',
  'overflow-y',
  'opacity',
]

const ALL_STYLE_DENYLIST = new Set([
  'animation',
  'animation-delay',
  'animation-direction',
  'animation-duration',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-name',
  'animation-play-state',
  'animation-timing-function',
  'caret-color',
  'cursor',
  'perspective-origin',
  'pointer-events',
  'resize',
  'scroll-behavior',
  'transition',
  'transition-delay',
  'transition-duration',
  'transition-property',
  'transition-timing-function',
  'user-select',
  '-webkit-tap-highlight-color',
])

function isElementNode(node) {
  return node?.nodeType === Node.ELEMENT_NODE
}

function shouldInlineAllStyles(element) {
  return (
    element.namespaceURI === SVG_NAMESPACE ||
    element.closest('svg') !== null ||
    element.closest('.katex') !== null
  )
}

function shouldSkipStyleProperty(property, value) {
  return ALL_STYLE_DENYLIST.has(property) || !value
}

function appendStyleDeclaration(styleText, declaration) {
  return styleText ? `${styleText}${declaration}` : declaration
}

function serializeStyles(element) {
  const computedStyle = window.getComputedStyle(element)
  const properties = shouldInlineAllStyles(element)
    ? Array.from(computedStyle)
    : INLINE_STYLE_PROPERTIES

  const declarations = []

  properties.forEach((property) => {
    const value = computedStyle.getPropertyValue(property)
    if (shouldSkipStyleProperty(property, value)) return
    declarations.push(`${property}:${value};`)
  })

  return declarations.join('')
}

function syncElementAttributes(originalElement, clonedElement) {
  let styleText = serializeStyles(originalElement)

  if (originalElement.tagName === 'TABLE') {
    styleText = appendStyleDeclaration(styleText, 'width:100%;')
  }

  if (originalElement.tagName === 'IMG') {
    styleText = appendStyleDeclaration(styleText, 'max-width:100%;height:auto;')
  }

  if (originalElement.tagName === 'HR') {
    const dividerHeight = window.getComputedStyle(originalElement).getPropertyValue('height')
    if (dividerHeight && dividerHeight !== '0px') {
      styleText = appendStyleDeclaration(styleText, `height:${dividerHeight};`)
    }
  }

  if (styleText) {
    clonedElement.setAttribute('style', styleText)
  } else {
    clonedElement.removeAttribute('style')
  }

  if (originalElement.tagName === 'A' && originalElement.href) {
    clonedElement.setAttribute('href', originalElement.href)
  }

  if (originalElement.tagName === 'IMG') {
    const imageSource = originalElement.currentSrc || originalElement.src
    if (imageSource) {
      clonedElement.setAttribute('src', imageSource)
    }
  }
}

function syncTreeWithInlineStyles(originalNode, clonedNode) {
  if (!originalNode || !clonedNode) return

  if (isElementNode(originalNode) && isElementNode(clonedNode)) {
    syncElementAttributes(originalNode, clonedNode)
  }

  const childCount = originalNode.childNodes.length
  for (let index = 0; index < childCount; index += 1) {
    syncTreeWithInlineStyles(originalNode.childNodes[index], clonedNode.childNodes[index])
  }
}

function normalizePlainText(text) {
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function createListParagraph(documentRef, listItem, markerText) {
  const hasBlockChildren = listItem.querySelector(
    'p, div, pre, blockquote, table, h1, h2, h3, h4, h5, h6'
  )
  const paragraph = documentRef.createElement(hasBlockChildren ? 'div' : 'p')
  const originalStyle = listItem.getAttribute('style') || ''
  const normalizedStyle = originalStyle.replace(/display\s*:\s*list-item\s*;?/gi, '')
  paragraph.setAttribute('style', `${normalizedStyle}display:block;`)

  const marker = documentRef.createElement('span')
  marker.textContent = markerText
  paragraph.appendChild(marker)

  Array.from(listItem.childNodes).forEach((node) => {
    paragraph.appendChild(node)
  })

  return paragraph
}

function normalizeListStructures(rootElement) {
  const lists = Array.from(rootElement.querySelectorAll('ul, ol')).reverse()

  lists.forEach((list) => {
    const listItems = Array.from(list.children).filter((child) => child.tagName === 'LI')
    if (listItems.length === 0) return

    const fragment = rootElement.ownerDocument.createDocumentFragment()
    const start = Number.parseInt(list.getAttribute('start') || '1', 10)
    const listOffset = Number.isFinite(start) ? start : 1

    listItems.forEach((listItem, index) => {
      const markerText = list.tagName === 'OL' ? `${listOffset + index}. ` : '• '
      fragment.appendChild(createListParagraph(rootElement.ownerDocument, listItem, markerText))
    })

    list.replaceWith(fragment)
  })
}

export function buildRichClipboardPayload(rootElement) {
  if (!(rootElement instanceof HTMLElement || rootElement instanceof SVGElement)) {
    throw new Error('复制源节点无效')
  }

  const clonedRoot = rootElement.cloneNode(true)
  syncTreeWithInlineStyles(rootElement, clonedRoot)
  normalizeListStructures(clonedRoot)

  return {
    html: clonedRoot.outerHTML,
    text: normalizePlainText(clonedRoot.innerText || clonedRoot.textContent || ''),
  }
}

export async function writeRichTextWithBrowserClipboard(payload) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      const htmlBlob = new Blob([payload.html], { type: 'text/html' })
      const textBlob = new Blob([payload.text], { type: 'text/plain' })
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      })

      await navigator.clipboard.write([clipboardItem])
      return
    } catch {
      // 浏览器剪贴板接口在非安全上下文或被拒绝权限时回退到 execCommand。
    }
  }

  const container = document.createElement('div')
  container.innerHTML = payload.html
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.contentEditable = 'true'
  document.body.appendChild(container)

  const range = document.createRange()
  range.selectNodeContents(container)

  const selection = window.getSelection()
  if (!selection) {
    document.body.removeChild(container)
    throw new Error('浏览器选择区不可用')
  }

  selection.removeAllRanges()
  selection.addRange(range)

  const copied = document.execCommand('copy')

  selection.removeAllRanges()
  document.body.removeChild(container)

  if (!copied) {
    throw new Error('浏览器剪贴板写入失败')
  }
}
