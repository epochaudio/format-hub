import DOMPurify from 'dompurify'
import { marked } from 'marked'
import katex from 'katex'
// 仅在文章包含图表时加载 Mermaid。
let mermaidPromise
function loadMermaid() {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })
    return mermaid
  })
  return mermaidPromise
}

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: false,
})

const FRONTMATTER_PATTERN = /^---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n)?/
const FENCED_CODE_BLOCK_PATTERN = /^[ \t]{0,3}(`{3,}|~{3,})/
const STRONG_LABEL_INLINE_COLON_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?[：:])\*\*([ \t]*)(.*)$/
const STRONG_LABEL_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?)\*\*([：:])([ \t]*)(.*)$/
const TIMELINE_TOKEN_PATTERN = /\{\{([^{}\r\n]+)\}\}/g
const EXPRESSION_BLOCK_OPEN_PATTERN = /^:::(summary|note|insight|risk|steps|compare|faq|term)(?:[ \t]+(.+?))?[ \t]*$/i
const EXPRESSION_BLOCK_CLOSE_PATTERN = /^:::[ \t]*$/
const EXPRESSION_BLOCK_PLACEHOLDER_PREFIX = 'FORMAT_HUB_EXPRESSION_BLOCK_'

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

// 脚注正则
const FOOTNOTE_REF_PATTERN = /\[\^(\w+)\]/g
const FOOTNOTE_DEF_PATTERN = /^\[\^(\w+)\]:\s*(.+)$/gm

// Mermaid 代码块检测
const MERMAID_PATTERN = /^```mermaid\n([\s\S]*?)```$/gm

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

let mermaidRenderCounter = 0

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

// 扩展语法交给 Markdown 分词器处理，代码块、行内代码、链接属性不会被预替换。
marked.use({
  renderer: {
    code({ text, lang }) {
      const language = (lang || '').split(/\s+/)[0]
      const attribute = language ? ` class="language-${escapeHtmlText(language)}"` : ''
      return `<pre><code${attribute}>${highlightCode(text)}</code></pre>\n`
    },
  },
  extensions: [
    {
      name: 'highlight',
      level: 'inline',
      start: (source) => source.indexOf('=='),
      tokenizer(source) {
        const match = /^==([^\n]+?)==/.exec(source)
        if (match) return { type: 'highlight', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) }
      },
      renderer(token) { return `<mark>${this.parser.parseInline(token.tokens)}</mark>` },
    },
    {
      name: 'blockMath',
      level: 'block',
      start: (source) => source.match(/^\$\$/m)?.index,
      tokenizer(source) {
        const match = /^\$\$[ \t]*\n?([\s\S]*?)\$\$[ \t]*(?:\n|$)/.exec(source)
        if (match) return { type: 'blockMath', raw: match[0], formula: match[1] }
      },
      renderer(token) {
        return katex.renderToString(token.formula.trim(), { displayMode: true, throwOnError: false })
      },
    },
    {
      name: 'inlineMath',
      level: 'inline',
      start: (source) => source.indexOf('$'),
      tokenizer(source) {
        const match = /^\$\$([^\n]+?)\$\$|^\$([^\n$]+?)\$/.exec(source)
        if (match) return { type: 'inlineMath', raw: match[0], formula: match[1] || match[2] }
      },
      renderer(token) {
        return katex.renderToString(token.formula.trim(), { displayMode: false, throwOnError: false })
      },
    },
  ],
})

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

function extractExpressionBlocks(text) {
  const lines = text.split(/\r?\n/)
  const output = []
  const blocks = []
  let activeFence = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const nextFence = updateFenceState(line, activeFence)
    const blockMatch = !activeFence ? line.match(EXPRESSION_BLOCK_OPEN_PATTERN) : null

    if (blockMatch) {
      const closeIndex = findExpressionBlockClose(lines, index)

      if (closeIndex === -1) {
        output.push(line)
        activeFence = nextFence
        continue
      }

      const type = blockMatch[1].toLowerCase()
      const title = (blockMatch[2] || '').trim()
      const placeholder = `${EXPRESSION_BLOCK_PLACEHOLDER_PREFIX}${blocks.length}`

      blocks.push({
        type,
        title,
        content: lines.slice(index + 1, closeIndex).join('\n').trim(),
        placeholder,
      })
      output.push(placeholder)
      index = closeIndex
      activeFence = null
      continue
    }

    output.push(line)
    activeFence = nextFence
  }

  return {
    text: output.join('\n'),
    blocks,
  }
}

function buildExpressionBlockHtml(block, bodyHtml) {
  const typeConfig = EXPRESSION_BLOCK_TYPES[block.type] || EXPRESSION_BLOCK_TYPES.note
  const title = block.title || typeConfig.label
  const titleHtml = title
    ? `<div class="content-block-title">${escapeHtmlText(title)}</div>`
    : ''

  return `<section class="content-block content-block-${block.type}">${titleHtml}<div class="content-block-body">${bodyHtml}</div></section>`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceExpressionBlockPlaceholders(html, renderedBlocks) {
  let result = html

  renderedBlocks.forEach(({ placeholder, html: blockHtml }) => {
    const escaped = escapeRegExp(placeholder)
    result = result.replace(new RegExp(`<p>\\s*${escaped}\\s*</p>`, 'g'), blockHtml)
    result = result.replace(new RegExp(escaped, 'g'), blockHtml)
  })

  return result
}

// 解析脚注
function parseFootnotes(text) {
  const footnotes = {}
  let idCounter = 0

  // 收集脚注定义
  text = text.replace(FOOTNOTE_DEF_PATTERN, (match, id, content) => {
    footnotes[id] = { id, content: content.trim(), index: ++idCounter }
    return ''
  })

  return { text, footnotes }
}

// 渲染脚注引用
function renderFootnoteRefs(text, footnotes) {
  return text.replace(FOOTNOTE_REF_PATTERN, (match, id) => {
    const fn = footnotes[id]
    if (!fn) return match
    return `<sup><a href="#footnote-${id}" id="footnote-ref-${id}">[${fn.index}]</a></sup>`
  })
}

// 生成脚注列表 HTML
function buildFootnoteList(footnotes) {
  const items = Object.values(footnotes).sort((a, b) => a.index - b.index)
  if (items.length === 0) return ''

  const listItems = items
    .map(
      (fn) => `
    <li id="footnote-${fn.id}">
      <span style="margin-right:8px">[${fn.index}]</span>
      ${fn.content}
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

// 处理 Mermaid 图表
async function renderMermaid(text) {
  const matches = []
  let match

  // 收集所有 mermaid 代码块
  while ((match = MERMAID_PATTERN.exec(text)) !== null) {
    matches.push({
      full: match[0],
      code: match[1].trim(),
      index: match.index,
    })
  }

  if (matches.length === 0) return text

  const mermaid = await loadMermaid()

  // 渲染每个图表
  let result = text
  for (let i = matches.length - 1; i >= 0; i--) {
    const { full, code } = matches[i]
    try {
      const id = `mermaid-${Date.now()}-${mermaidRenderCounter++}`
      const { svg } = await mermaid.render(id, code)
      result = result.slice(0, matches[i].index) + `\n<div class="mermaid-chart">${svg}</div>\n` + result.slice(matches[i].index + full.length)
    } catch (e) {
      result = result.slice(0, matches[i].index) + `<div style="color:red;padding:16px;background:#fef2f2;border-radius:8px">Mermaid 渲染失败</div>` + result.slice(matches[i].index + full.length)
    }
  }

  return result
}

async function renderMarkdownFragment(text, { renderMermaidBlocks = true } = {}) {
  let fragmentText = text

  if (renderMermaidBlocks) {
    fragmentText = await renderMermaid(fragmentText)
  }

  let html = marked.parse(fragmentText)
  html = renderTimelineTokens(html)

  return html
}

function renderMarkdownFragmentSync(text) {
  const fragmentText = text

  let html = marked.parse(fragmentText)
  html = renderTimelineTokens(html)

  return html
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
export async function renderMarkdown(input, options = {}) {
  const { includeTOC = false, codeTheme = 'github', darkMode = false } = options

  // 1. 预处理 Markdown
  let text = normalizeMarkdown(input)

  // 2. 解析脚注
  const { text: textWithoutFootnotes, footnotes } = parseFootnotes(text)
  text = textWithoutFootnotes

  // 3. 抽取结构化表达组件，主体和组件内容共用同一套渲染管线
  const { text: textWithPlaceholders, blocks } = extractExpressionBlocks(text)

  // 4. 渲染主体 Markdown
  let html = await renderMarkdownFragment(textWithPlaceholders)

  // 5. 渲染脚注引用
  html = renderFootnoteRefs(html, footnotes)

  // 6. 渲染结构化表达组件
  const renderedBlocks = await Promise.all(
    blocks.map(async (block) => {
      const bodyHtml = renderFootnoteRefs(await renderMarkdownFragment(block.content), footnotes)
      return {
        placeholder: block.placeholder,
        html: buildExpressionBlockHtml(block, bodyHtml),
      }
    })
  )
  html = replaceExpressionBlockPlaceholders(html, renderedBlocks)

  // 7. 生成目录
  let toc = null
  if (includeTOC) {
    toc = generateTOC(html)
    if (toc) {
      html = addHeadingIds(html, toc.headings)
      html = toc.html + html
    }
  }

  // 8. 添加脚注列表
  html += buildFootnoteList(footnotes)

  // 9. 安全过滤
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return sanitized
}

// 同步版本（用于非异步场景）
export function renderMarkdownSync(input, options = {}) {
  const { includeTOC = false, codeTheme = 'github', darkMode = false } = options

  // 1. 预处理 Markdown
  let text = normalizeMarkdown(input)

  // 2. 解析脚注
  const { text: textWithoutFootnotes, footnotes } = parseFootnotes(text)
  text = textWithoutFootnotes

  // 3. 抽取结构化表达组件
  const { text: textWithPlaceholders, blocks } = extractExpressionBlocks(text)

  // 4. 渲染主体 Markdown（同步版本跳过 Mermaid）
  let html = renderMarkdownFragmentSync(textWithPlaceholders)

  // 5. 渲染脚注引用
  html = renderFootnoteRefs(html, footnotes)

  // 6. 渲染结构化表达组件
  const renderedBlocks = blocks.map((block) => {
    const bodyHtml = renderFootnoteRefs(renderMarkdownFragmentSync(block.content), footnotes)
    return {
      placeholder: block.placeholder,
      html: buildExpressionBlockHtml(block, bodyHtml),
    }
  })
  html = replaceExpressionBlockPlaceholders(html, renderedBlocks)

  // 7. 生成目录
  let toc = null
  if (includeTOC) {
    toc = generateTOC(html)
    if (toc) {
      html = addHeadingIds(html, toc.headings)
      html = toc.html + html
    }
  }

  // 8. 添加脚注列表
  html += buildFootnoteList(footnotes)

  // 9. 安全过滤
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return sanitized
}
