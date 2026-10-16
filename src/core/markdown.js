import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import katex from 'katex'

// 标签使用 SVG 文本而不是 foreignObject：公众号与 PDF 都能保留，也能通过 DOMPurify 的标准 SVG 规则。
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  htmlLabels: false,
  flowchart: { htmlLabels: false },
}
// Mermaid 输出不经过正文白名单，而是单独按 DOMPurify 的标准 SVG 规则过滤。
const MERMAID_SANITIZE_OPTIONS = { USE_PROFILES: { svg: true, svgFilters: true } }
const MERMAID_ERROR_HTML = '<div style="color:red;padding:16px;background:#fef2f2;border-radius:8px">Mermaid 渲染失败</div>'
// 未改动的图表直接复用结果；超过上限时淘汰最早写入的图表。
const MERMAID_CACHE_LIMIT = 50

// 仅在文章包含图表时加载 Mermaid。
let mermaidPromise
function loadMermaid() {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize(MERMAID_CONFIG)
    return mermaid
  })
  return mermaidPromise
}

const FRONTMATTER_PATTERN = /^---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n)?/
const FENCED_CODE_BLOCK_PATTERN = /^[ \t]{0,3}(`{3,}|~{3,})/
const STRONG_LABEL_INLINE_COLON_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?[：:])\*\*([ \t]*)(.*)$/
const STRONG_LABEL_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?)\*\*([：:])([ \t]*)(.*)$/
const TIMELINE_TOKEN_PATTERN = /\{\{([^{}\r\n]+)\}\}/g

const EXPRESSION_BLOCK_TYPES = {
  summary: { label: '摘要' },
  note: { label: '提示' },
  insight: { label: '洞察' },
  risk: { label: '风险' },
  steps: { label: '步骤' },
  compare: { label: '对比' },
  faq: { label: 'FAQ' },
  term: { label: '术语' },
}
const EXPRESSION_BLOCK_TYPE_NAMES = Object.keys(EXPRESSION_BLOCK_TYPES).join('|')
const EXPRESSION_BLOCK_OPEN_PATTERN = new RegExp(`^:::(${EXPRESSION_BLOCK_TYPE_NAMES})(?:[ \\t]+(.+?))?[ \\t]*$`, 'i')
const EXPRESSION_BLOCK_START_PATTERN = new RegExp(`^:::(?:${EXPRESSION_BLOCK_TYPE_NAMES})(?:[ \\t]|$)`, 'im')
const EXPRESSION_BLOCK_CLOSE_PATTERN = /^:::[ \t]*$/

// 脚注定义独占一行且内容非空；引用与定义共用同一 id 规则。
const FOOTNOTE_DEFINITION_PATTERN = /^\[\^(\w+)\]:[ \t]*(\S[^\n]*)(?:\n|$)/
const FOOTNOTE_DEFINITION_START_PATTERN = /^\[\^\w+\]:[ \t]*\S/m
const FOOTNOTE_REFERENCE_PATTERN = /^\[\^(\w+)\]/

// 开头 $ 后紧跟非空白，结尾 $ 前为非空白且其后不是数字，避免把“$5 起，$10 封顶”识别为公式。
const INLINE_MATH_PATTERN = /^\$\$([^\n]+?)\$\$|^\$(?=\S)([^\n$]*?\S)\$(?!\d)/
const BLOCK_MATH_PATTERN = /^\$\$[ \t]*\n?([\s\S]*?)\$\$[ \t]*(?:\n|$)/

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
  'sup',
  'div',
  'section',
  'span',
  'svg',
  'g',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'path',
  'text',
  'tspan',
  'defs',
  'marker',
  'use',
  'clippath',
  'mask',
  'pattern',
  'lineargradient',
  'radialgradient',
  'stop',
]

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'style',
  'width',
  'height',
  'viewbox',
  // KaTeX 的根号、箭头等可伸缩符号依赖它裁切超宽 viewBox，缺失时符号缩成不可见。
  'preserveaspectratio',
  'fill',
  'stroke',
  'stroke-width',
  'd',
  'cx',
  'cy',
  'r',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'marker-end',
  'marker-start',
  'marker-mid',
]

// 代码高亮主题
export const codeThemes = {
  github: {
    label: 'GitHub',
    light: `
      .wx-content pre {
        background: #f6f8fa;
        color: #24292f;
      }
      .wx-content code .keyword { color: #cf222e; }
      .wx-content code .string { color: #0a3069; }
      .wx-content code .comment { color: #6e7781; }
      .wx-content code .function { color: #8250df; }
      .wx-content code .number { color: #0550ae; }
      .wx-content code .operator { color: #24292f; }
    `,
    dark: `
      .wx-content pre {
        background: #161b22;
        color: #c9d1d9;
      }
      .wx-content code .keyword { color: #ff7b72; }
      .wx-content code .string { color: #a5d6ff; }
      .wx-content code .comment { color: #8b949e; }
      .wx-content code .function { color: #d2a8ff; }
      .wx-content code .number { color: #79c0ff; }
      .wx-content code .operator { color: #c9d1d9; }
    `,
  },
  atomOne: {
    label: 'Atom One',
    light: `
      .wx-content pre {
        background: #fafafa;
        color: #383a42;
      }
      .wx-content code .keyword { color: #a626a4; }
      .wx-content code .string { color: #50a14f; }
      .wx-content code .comment { color: #a0a1a7; }
      .wx-content code .function { color: #4078f2; }
      .wx-content code .number { color: #986801; }
      .wx-content code .operator { color: #383a42; }
    `,
    dark: `
      .wx-content pre {
        background: #282c34;
        color: #abb2bf;
      }
      .wx-content code .keyword { color: #c678dd; }
      .wx-content code .string { color: #98c379; }
      .wx-content code .comment { color: #5c6370; }
      .wx-content code .function { color: #61afef; }
      .wx-content code .number { color: #d19a66; }
      .wx-content code .operator { color: #abb2bf; }
    `,
  },
  dracula: {
    label: 'Dracula',
    dark: `
      .wx-content pre {
        background: #282a36;
        color: #f8f8f2;
      }
      .wx-content code .keyword { color: #ff79c6; }
      .wx-content code .string { color: #f1fa8c; }
      .wx-content code .comment { color: #6272a4; }
      .wx-content code .function { color: #50fa7b; }
      .wx-content code .number { color: #bd93f9; }
      .wx-content code .operator { color: #ff79c6; }
    `,
  },
  nord: {
    label: 'Nord',
    dark: `
      .wx-content pre {
        background: #2e3440;
        color: #d8dee9;
      }
      .wx-content code .keyword { color: #81a1c1; }
      .wx-content code .string { color: #a3be8c; }
      .wx-content code .comment { color: #616e88; }
      .wx-content code .function { color: #88c0d0; }
      .wx-content code .number { color: #b48ead; }
      .wx-content code .operator { color: #81a1c1; }
    `,
  },
}

// 只扫描原始代码一次，生成的 HTML 不再参与匹配。
export function highlightCode(code) {
  const tokenPattern = /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<keyword>\b(?:const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|new|this|typeof|instanceof)\b)|(?<number>\b\d+(?:\.\d+)?\b)|(?<operator>===|!==|==|!=|<=|>=|&&|\|\||[+*/=<>!?:-])/g
  let html = ''
  let offset = 0
  for (const match of code.matchAll(tokenPattern)) {
    html += escapeHtmlText(code.slice(offset, match.index))
    const className = Object.keys(match.groups).find((key) => match.groups[key] !== undefined)
    html += `<span class="${className}">${escapeHtmlText(match[0])}</span>`
    offset = match.index + match[0].length
  }
  return html + escapeHtmlText(code.slice(offset))
}

// 不依赖单次渲染状态的语法扩展，可在各次渲染之间共用。
const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start: (source) => source.indexOf('=='),
  tokenizer(source) {
    const match = /^==([^\n]+?)==/.exec(source)
    if (match) return { type: 'highlight', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) }
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`
  },
}

const blockMathExtension = {
  name: 'blockMath',
  level: 'block',
  start: (source) => source.match(/^\$\$/m)?.index,
  tokenizer(source) {
    const match = BLOCK_MATH_PATTERN.exec(source)
    if (match) return { type: 'blockMath', raw: match[0], formula: match[1] }
  },
  renderer(token) {
    return katex.renderToString(token.formula.trim(), { displayMode: true, throwOnError: false })
  },
}

const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline',
  start: (source) => source.indexOf('$'),
  tokenizer(source) {
    const match = INLINE_MATH_PATTERN.exec(source)
    if (match) return { type: 'inlineMath', raw: match[0], formula: match[1] || match[2] }
  },
  renderer(token) {
    return katex.renderToString(token.formula.trim(), { displayMode: false, throwOnError: false })
  },
}

// :::类型 标题 … ::: 容器。结束行跳过代码围栏内的 :::，正文按完整 Markdown 解析。
const expressionBlockExtension = {
  name: 'expressionBlock',
  level: 'block',
  start: (source) => source.match(EXPRESSION_BLOCK_START_PATTERN)?.index,
  tokenizer(source) {
    const firstLineEnd = source.indexOf('\n')
    const openMatch = (firstLineEnd === -1 ? source : source.slice(0, firstLineEnd)).match(EXPRESSION_BLOCK_OPEN_PATTERN)
    if (!openMatch) return

    const lines = source.split('\n')
    const closeIndex = findExpressionBlockClose(lines, 0)
    if (closeIndex === -1) return

    const consumedLines = lines.slice(0, closeIndex + 1).join('\n')
    const hasTrailingNewline = closeIndex < lines.length - 1

    return {
      type: 'expressionBlock',
      raw: hasTrailingNewline ? `${consumedLines}\n` : consumedLines,
      blockType: openMatch[1].toLowerCase(),
      title: (openMatch[2] || '').trim(),
      tokens: this.lexer.blockTokens(lines.slice(1, closeIndex).join('\n'), []),
    }
  },
  renderer(token) {
    const typeConfig = EXPRESSION_BLOCK_TYPES[token.blockType]
    const title = token.title || typeConfig.label

    return `<section class="content-block content-block-${token.blockType}"><div class="content-block-title">${escapeHtmlText(title)}</div><div class="content-block-body">${this.parser.parse(token.tokens)}</div></section>\n`
  },
}

// 脚注编号依赖全文定义，因此扩展读写本次渲染的脚注表。
function createFootnoteExtensions(footnotes) {
  const definition = {
    name: 'footnoteDefinition',
    level: 'block',
    start: (source) => source.match(FOOTNOTE_DEFINITION_START_PATTERN)?.index,
    tokenizer(source) {
      const match = FOOTNOTE_DEFINITION_PATTERN.exec(source)
      if (match) {
        return { type: 'footnoteDefinition', raw: match[0], id: match[1], tokens: this.lexer.inline(match[2].trim()) }
      }
    },
    // 定义不在原位置输出，渲染好的内容交给文末脚注列表。
    renderer(token) {
      const footnote = footnotes.get(token.id)
      if (footnote && footnote.html === null) {
        footnote.html = this.parser.parseInline(token.tokens)
      }
      return ''
    },
  }

  const reference = {
    name: 'footnoteReference',
    level: 'inline',
    start: (source) => source.indexOf('[^'),
    tokenizer(source) {
      const match = FOOTNOTE_REFERENCE_PATTERN.exec(source)
      if (match) return { type: 'footnoteReference', raw: match[0], id: match[1] }
    },
    renderer(token) {
      const footnote = footnotes.get(token.id)
      if (!footnote) return escapeHtmlText(token.raw)
      return `<sup><a href="#footnote-${token.id}" id="footnote-ref-${token.id}">[${footnote.index}]</a></sup>`
    },
  }

  return [definition, reference]
}

// 每次渲染使用独立实例，脚注表和图表列表不会跨文章残留，也不修改全局 marked。
function createMarkdownParser(context) {
  return new Marked(
    { gfm: true, breaks: false },
    {
      renderer: {
        code({ text, lang }) {
          const language = (lang || '').split(/\s+/)[0]
          if (language === 'mermaid') {
            const chartIndex = context.mermaidCharts.push(text.trim()) - 1
            return `<div class="mermaid-chart" data-mermaid-chart="${chartIndex}"></div>\n`
          }

          const attribute = language ? ` class="language-${escapeHtmlText(language)}"` : ''
          return `<pre><code${attribute}>${highlightCode(text)}</code></pre>\n`
        },
      },
      extensions: [
        highlightExtension,
        blockMathExtension,
        inlineMathExtension,
        expressionBlockExtension,
        ...createFootnoteExtensions(context.footnotes),
      ],
    }
  )
}

// 先按文中定义顺序编号，渲染引用时才能写出正确序号。重复定义以第一次为准。
function collectFootnoteDefinitions(markdownParser, tokens, footnotes) {
  markdownParser.walkTokens(tokens, (token) => {
    if (token.type === 'footnoteDefinition' && !footnotes.has(token.id)) {
      footnotes.set(token.id, { id: token.id, index: footnotes.size + 1, html: null })
    }
  })
}

function shouldSkipTimelineTokenNode(node) {
  let current = node?.parentElement || null

  while (current) {
    const tagName = current.tagName?.toLowerCase()
    if (tagName && ['a', 'code', 'pre', 'script', 'style', 'textarea'].includes(tagName)) {
      return true
    }

    if (current.classList?.contains('katex') || current.classList?.contains('mermaid-chart')) {
      return true
    }

    current = current.parentElement
  }

  return false
}

function buildTimelineTokenFragment(documentRef, text) {
  TIMELINE_TOKEN_PATTERN.lastIndex = 0

  const fragment = documentRef.createDocumentFragment()
  let lastIndex = 0
  let match

  while ((match = TIMELINE_TOKEN_PATTERN.exec(text)) !== null) {
    const [raw, inner] = match
    const value = inner.trim()

    if (!value) {
      continue
    }

    if (match.index > lastIndex) {
      fragment.appendChild(documentRef.createTextNode(text.slice(lastIndex, match.index)))
    }

    const token = documentRef.createElement('span')
    token.className = 'timeline-token'
    token.textContent = value
    fragment.appendChild(token)

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    fragment.appendChild(documentRef.createTextNode(text.slice(lastIndex)))
  }

  return fragment
}

function renderTimelineTokens(html) {
  if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
    return html
  }

  const template = document.createElement('template')
  template.innerHTML = html

  const textNodes = []
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !TIMELINE_TOKEN_PATTERN.test(node.nodeValue)) {
        TIMELINE_TOKEN_PATTERN.lastIndex = 0
        return NodeFilter.FILTER_REJECT
      }

      TIMELINE_TOKEN_PATTERN.lastIndex = 0
      return shouldSkipTimelineTokenNode(node)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
    },
  })

  let currentNode = walker.nextNode()
  while (currentNode) {
    textNodes.push(currentNode)
    currentNode = walker.nextNode()
  }

  textNodes.forEach((node) => {
    const fragment = buildTimelineTokenFragment(document, node.nodeValue)
    node.parentNode?.replaceChild(fragment, node)
  })

  return template.innerHTML
}

function escapeHtmlText(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function updateFenceState(line, activeFence) {
  const fenceMatch = line.match(FENCED_CODE_BLOCK_PATTERN)
  if (!fenceMatch) return activeFence

  const marker = fenceMatch[1][0]
  const length = fenceMatch[1].length

  if (!activeFence) {
    return { marker, length }
  }

  if (activeFence.marker === marker && length >= activeFence.length) {
    return null
  }

  return activeFence
}

function findExpressionBlockClose(lines, startIndex) {
  let activeFence = null

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    activeFence = updateFenceState(lines[index], activeFence)

    if (!activeFence && EXPRESSION_BLOCK_CLOSE_PATTERN.test(lines[index])) {
      return index
    }
  }

  return -1
}

// 生成脚注列表 HTML
function buildFootnoteList(footnotes) {
  const items = [...footnotes.values()]
  if (items.length === 0) return ''

  const listItems = items
    .map(
      (fn) => `
    <li id="footnote-${fn.id}">
      <span style="margin-right:8px">[${fn.index}]</span>
      ${fn.html ?? ''}
      <a href="#footnote-ref-${fn.id}" style="margin-left:4px;font-size:0.85em">↩</a>
    </li>
  `
    )
    .join('')

  return `
    <hr style="margin:32px 0 16px;border:none;border-top:1px solid #e5e7eb">
    <section class="footnotes">
      <h4 style="font-size:14px;color:#6b7280;margin:0 0 12px">脚注</h4>
      <ol style="padding-left:20px;font-size:14px;color:#4b5563;line-height:1.8">
        ${listItems}
      </ol>
    </section>
  `
}

// 生成目录
export function generateTOC(html) {
  const headings = []
  const headingPattern = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g
  let match

  while ((match = headingPattern.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].replace(/<[^>]+>/g, '') // 去除 HTML 标签
    const id = `heading-${headings.length}`
    headings.push({ level, text, id })
  }

  if (headings.length < 2) return null

  const items = headings
    .map(
      ({ level, text, id }) => `
    <li style="margin-left:${(level - 1) * 16}px">
      <a href="#${id}" style="color:inherit;text-decoration:none">${text}</a>
    </li>
  `
    )
    .join('')

  return {
    html: `
      <nav class="toc" style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:0 0 24px">
        <h4 style="font-size:14px;color:#6b7280;margin:0 0 12px">目录</h4>
        <ul style="list-style:none;padding:0;margin:0;font-size:14px;line-height:2">
          ${items}
        </ul>
      </nav>
    `,
    headings,
  }
}

// 为标题添加锚点 ID
function addHeadingIds(html, headings) {
  let index = 0
  return html.replace(/<h([1-6])([^>]*)>/g, (match, level, attrs) => {
    const heading = headings[index++]
    if (heading) {
      return `<h${level}${attrs} id="${heading.id}">`
    }
    return match
  })
}

let mermaidRenderCounter = 0
const mermaidChartCache = new Map()

function rememberMermaidChart(code, html) {
  mermaidChartCache.delete(code)
  mermaidChartCache.set(code, html)
  if (mermaidChartCache.size > MERMAID_CACHE_LIMIT) {
    mermaidChartCache.delete(mermaidChartCache.keys().next().value)
  }
}

async function renderMermaidChart(code) {
  if (mermaidChartCache.has(code)) {
    const cached = mermaidChartCache.get(code)
    rememberMermaidChart(code, cached)
    return cached
  }

  const mermaid = await loadMermaid()
  let html
  try {
    const { svg } = await mermaid.render(`format-hub-mermaid-${mermaidRenderCounter++}`, code)
    html = DOMPurify.sanitize(svg, MERMAID_SANITIZE_OPTIONS)
  } catch {
    html = MERMAID_ERROR_HTML
  }

  rememberMermaidChart(code, html)
  return html
}

// 正文过滤之后再填入图表，图表只走 SVG 过滤规则，不受正文白名单影响。
async function injectMermaidCharts(html, charts) {
  if (charts.length === 0) return html

  const template = document.createElement('template')
  template.innerHTML = html

  for (const placeholder of template.content.querySelectorAll('[data-mermaid-chart]')) {
    const code = charts[Number(placeholder.getAttribute('data-mermaid-chart'))]
    placeholder.removeAttribute('data-mermaid-chart')
    placeholder.innerHTML = code === undefined ? '' : await renderMermaidChart(code)
  }

  return template.innerHTML
}

export function normalizeMarkdown(input) {
  const normalized = input
    .replace(FRONTMATTER_PATTERN, '')


  return normalizeStrongLabelColons(normalized)
}

function normalizeStrongLabelColons(text) {
  const lines = text.split(/\r?\n/)
  let activeFence = null

  return lines
    .map((line) => {
      const fenceMatch = line.match(FENCED_CODE_BLOCK_PATTERN)
      if (fenceMatch) {
        const marker = fenceMatch[1][0]
        const length = fenceMatch[1].length

        if (!activeFence) {
          activeFence = { marker, length }
          return line
        }

        if (activeFence.marker === marker && length >= activeFence.length) {
          activeFence = null
        }

        return line
      }

      if (activeFence) return line

      const normalizedInlineColon = line.replace(
        STRONG_LABEL_INLINE_COLON_PATTERN,
        (match, prefix, labelWithColon, spacing, rest) => {
          if (!rest) {
            return `${prefix}**${labelWithColon}**`
          }

          return `${prefix}<strong>${labelWithColon}</strong>${spacing}${rest}`
        }
      )

      if (normalizedInlineColon !== line) {
        return normalizedInlineColon
      }

      return line.replace(STRONG_LABEL_PATTERN, (match, prefix, label, colon, spacing, rest) => {
        if (!rest) {
          return `${prefix}**${label}${colon}**`
        }

        return `${prefix}<strong>${label}${colon}</strong>${spacing}${rest}`
      })
    })
    .join('\n')
}

// 主渲染函数
export async function renderMarkdown(input, { includeTOC = false } = {}) {
  const context = { footnotes: new Map(), mermaidCharts: [] }
  const markdownParser = createMarkdownParser(context)

  // 1. 预处理后分词，脚注、表达组件、图表和公式都在分词阶段识别，代码内容不会被误改
  const tokens = markdownParser.lexer(normalizeMarkdown(input))
  collectFootnoteDefinitions(markdownParser, tokens, context.footnotes)

  // 2. 输出 HTML 并处理时间标记
  let html = renderTimelineTokens(markdownParser.parser(tokens))

  // 3. 生成目录
  if (includeTOC) {
    const toc = generateTOC(html)
    if (toc) {
      html = addHeadingIds(html, toc.headings)
      html = toc.html + html
    }
  }

  // 4. 添加脚注列表
  html += buildFootnoteList(context.footnotes)

  // 5. 安全过滤正文，再填入单独过滤的图表
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return injectMermaidCharts(sanitized, context.mermaidCharts)
}
