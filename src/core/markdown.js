import DOMPurify from 'dompurify'
import { marked } from 'marked'
import katex from 'katex'
import mermaid from 'mermaid'

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
})

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: false,
})

const FRONTMATTER_PATTERN = /^---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n)?/
const HIGHLIGHT_PATTERN = /==(.+?)==/g
const FENCED_CODE_BLOCK_PATTERN = /^[ \t]{0,3}(`{3,}|~{3,})/
const STRONG_LABEL_INLINE_COLON_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?[：:])\*\*([ \t]*)(.*)$/
const STRONG_LABEL_PATTERN = /^([ \t]{0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?)\*\*([^*\n]+?)\*\*([：:])([ \t]*)(.*)$/
const TIMELINE_TOKEN_PATTERN = /\{\{([^{}\r\n]+)\}\}/g

// 脚注正则
const FOOTNOTE_REF_PATTERN = /\[\^(\w+)\]/g
const FOOTNOTE_DEF_PATTERN = /^\[\^(\w+)\]:\s*(.+)$/gm

// 数学公式正则
const INLINE_MATH_PATTERN = /\$\$(.+?)\$\$|\$([^\n$]+?)\$/g
const BLOCK_MATH_PATTERN = /^\$\$\s*\n?([\s\S]*?)\n?\$\$$/gm

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

// 简单的语法高亮
function highlightCode(code, language) {
  // 转义 HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 定义高亮规则
  const rules = [
    { pattern: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, className: 'comment' },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'string' },
    { pattern: /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|new|this|typeof|instanceof)\b/g, className: 'keyword' },
    { pattern: /\b(function|class)\s+(\w+)/g, className: 'function' },
    { pattern: /\b(\d+(?:\.\d+)?)\b/g, className: 'number' },
    { pattern: /(\+|-|\*|\/|=|==|===|!=|!==|<|>|<=|>=|&&|\|\||!|\?|:)/g, className: 'operator' },
  ]

  // 应用高亮（简单实现，可能有边界问题）
  rules.forEach(({ pattern, className }) => {
    html = html.replace(pattern, (match) => {
      // 避免重复包裹
      if (match.startsWith('<span')) return match
      return `<span class="${className}">${match}</span>`
    })
  })

  return html
}

// 渲染数学公式
function renderMath(text) {
  // 块级公式 $$
  text = text.replace(BLOCK_MATH_PATTERN, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })
    } catch (e) {
      return `<div style="color:red">公式错误: ${formula}</div>`
    }
  })

  // 行内公式 $...$
  text = text.replace(INLINE_MATH_PATTERN, (match, display, inline) => {
    const formula = (display || inline || '').trim()
    if (!formula) return match
    try {
      return katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
      })
    } catch (e) {
      return `<span style="color:red">$${formula}$</span>`
    }
  })

  return text
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

  // 渲染每个图表
  let result = text
  for (let i = matches.length - 1; i >= 0; i--) {
    const { full, code } = matches[i]
    try {
      const id = `mermaid-${Date.now()}-${i}`
      const { svg } = await mermaid.render(id, code)
      result = result.slice(0, matches[i].index) + `\n<div class="mermaid-chart">${svg}</div>\n` + result.slice(matches[i].index + full.length)
    } catch (e) {
      result = result.slice(0, matches[i].index) + `<div style="color:red;padding:16px;background:#fef2f2;border-radius:8px">Mermaid 渲染失败</div>` + result.slice(matches[i].index + full.length)
    }
  }

  return result
}

export function normalizeMarkdown(input) {
  const normalized = input
    .replace(FRONTMATTER_PATTERN, '')
    .replace(HIGHLIGHT_PATTERN, '<mark>$1</mark>')

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

  // 3. 渲染 Mermaid（在 marked 之前处理）
  text = await renderMermaid(text)

  // 4. 渲染数学公式
  text = renderMath(text)

  // 5. 渲染 Markdown
  let html = marked.parse(text)

  // 6. 渲染受控的时间标记语法
  html = renderTimelineTokens(html)

  // 7. 代码高亮
  html = html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    const highlighted = highlightCode(decoded, lang || 'text')
    return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${highlighted}</code></pre>`
  })

  // 8. 渲染脚注引用
  html = renderFootnoteRefs(html, footnotes)

  // 9. 生成目录
  let toc = null
  if (includeTOC) {
    toc = generateTOC(html)
    if (toc) {
      html = addHeadingIds(html, toc.headings)
      html = toc.html + html
    }
  }

  // 10. 添加脚注列表
  html += buildFootnoteList(footnotes)

  // 11. 安全过滤
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

  // 3. 渲染数学公式（跳过 Mermaid）
  text = renderMath(text)

  // 4. 渲染 Markdown
  let html = marked.parse(text)

  // 5. 渲染受控的时间标记语法
  html = renderTimelineTokens(html)

  // 6. 代码高亮
  html = html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    const highlighted = highlightCode(decoded, lang || 'text')
    return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${highlighted}</code></pre>`
  })

  // 7. 渲染脚注引用
  html = renderFootnoteRefs(html, footnotes)

  // 8. 生成目录
  let toc = null
  if (includeTOC) {
    toc = generateTOC(html)
    if (toc) {
      html = addHeadingIds(html, toc.headings)
      html = toc.html + html
    }
  }

  // 9. 添加脚注列表
  html += buildFootnoteList(footnotes)

  // 10. 安全过滤
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return sanitized
}
