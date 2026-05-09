import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_THEME_KEY, buildHtmlDocument, resolveThemeKey, themes, themeGroups } from './themes'
import { renderMarkdown, codeThemes as codeThemeList } from './core/markdown'
import { buildRichClipboardPayload, writeRichTextWithBrowserClipboard } from './core/clipboard'
import {
  DEFAULT_PDF_FONT_KEY,
  DEFAULT_PDF_FOOTER_TEMPLATE,
  DEFAULT_PDF_HEADER_TEMPLATE,
  DEFAULT_PDF_MARGIN_INPUTS,
  DEFAULT_PDF_MARGIN_MM,
  DEFAULT_PDF_PAGE_SIZE,
  PDF_FONT_OPTIONS,
  PDF_MARGIN_FIELDS,
  PDF_PAGE_SIZE_OPTIONS,
  extractMarkdownTitle,
  parseNonNegativeDecimalInput,
  resolvePdfFontFamily,
  sanitizeNonNegativeDecimalInput,
} from './core/pdf'
import appLogo from '../build/icon.png'
import 'katex/dist/katex.min.css'

const STORAGE_KEY = 'format-hub.markdown'
const CONTENT_MAX_WIDTH_STORAGE_KEY = 'format-hub.contentMaxWidth'

function sanitizePositiveIntegerInput(value) {
  return value.replace(/[^\d]/g, '')
}

function parseContentMaxWidth(value) {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return parsed
}

const DEFAULT_MARKDOWN = `# 主题收敛之后，文章更应该会表达

:::summary
Format Hub 会从“很多颜色主题”转向“少量场景主题 + 结构化表达组件”。主题负责气质，组件负责表达。
:::

这是第一段正文。你可以直接把 Markdown 粘贴进来，右侧会实时生成适合公众号排版的 HTML 预览。基础语法仍然支持 **粗体**、*斜体*、==高亮== 和 [链接](https://example.com)。

:::insight 为什么要减少主题？
用户选择排版时，本质上是在选择文章场景。颜色变体越多，越容易把注意力从内容结构带偏。
:::

:::note 使用建议
先选接近文章目标的场景主题，再用摘要、洞察、风险、步骤、FAQ 等结构组件增强表达。
:::

## 数学公式

行内公式：$E = mc^2$

块级公式：
$$\\int_{a}^{b} f(x) \\mathrm{d}x = F(b) - F(a)$$

## Mermaid 图表

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]
    C --> E[结束]
    D --> E
\`\`\`

## 代码高亮

\`\`\`js
// 计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

const result = fibonacci(10)
console.log(result) // 55
\`\`\`

## 脚注示例

这是一个带有脚注的句子[^1]。

[^1]: 这是脚注的内容说明。

## 表格示例

| 项目 | 说明 |
| --- | --- |
| 输入 | Markdown |
| 输出 | 公众号 HTML |

:::compare 主题收敛前后
| 方向 | 旧方式 | 新方式 |
| --- | --- | --- |
| 主题选择 | 系列 × 颜色 | 8 个场景主题 |
| 复杂度来源 | 皮肤数量 | 表达组件 |
| 维护重点 | 同步多份 CSS | 强化结构语义 |
:::

## 时序标记

政策发布 → 空域规划（{{3-6月}}）→ 基建招标（{{6-12月}}）→ 飞行器采购（{{12-24月}}）<br>
→ 适航认证（{{18-36月}}）→ 运营取证（{{6-12月}}）→ 商业运营（{{持续}}）→ 利润兑现（{{24-36月滞后}}）

:::risk 迁移风险
如果历史主题键没有映射，用户打开应用时会看到陌生主题。因此需要保留旧主题到场景主题的迁移表。
:::

:::steps 后续实施节奏
1. 先把 UI 收敛到 8 个场景主题。
2. 再让结构化表达组件覆盖预览、复制、HTML 导出和 PDF 导出。
3. 最后补主题样张库和独立阅读版 HTML。
:::

:::faq 常见问题
- **旧主题会立刻删除吗？** 不会。第一阶段只收敛 UI，旧主题仍用于迁移和兼容。
- **代码主题还保留吗？** 保留。排版主题和代码高亮主题继续独立选择。
:::

:::term 场景主题
场景主题不是单纯的颜色方案，而是围绕文章类型设计的排版策略。
:::

> 这是引用块，适合写结论、提示和摘要。
`

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const isMacPlatform =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const previewContentRef = useRef(null)
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [theme, setTheme] = useState(DEFAULT_THEME_KEY)
  const [codeTheme, setCodeTheme] = useState('github')
  const [showTOC, setShowTOC] = useState(false)
  const [isDarkCode, setIsDarkCode] = useState(false)
  const [contentMaxWidthInput, setContentMaxWidthInput] = useState('')
  const [copyState, setCopyState] = useState('idle')
  const [renderedHtml, setRenderedHtml] = useState('')
  const [isThemeGalleryOpen, setIsThemeGalleryOpen] = useState(false)
  const [isPdfSettingsOpen, setIsPdfSettingsOpen] = useState(false)
  const [pdfPageSize, setPdfPageSize] = useState(DEFAULT_PDF_PAGE_SIZE)
  const [pdfFontKey, setPdfFontKey] = useState(DEFAULT_PDF_FONT_KEY)
  const [pdfTitleInput, setPdfTitleInput] = useState('')
  const [pdfHeaderTemplate, setPdfHeaderTemplate] = useState(DEFAULT_PDF_HEADER_TEMPLATE)
  const [pdfFooterTemplate, setPdfFooterTemplate] = useState(DEFAULT_PDF_FOOTER_TEMPLATE)
  const [pdfMarginInputs, setPdfMarginInputs] = useState(DEFAULT_PDF_MARGIN_INPUTS)
  const [pdfExportState, setPdfExportState] = useState('idle')
  const contentMaxWidth = useMemo(
    () => parseContentMaxWidth(contentMaxWidthInput),
    [contentMaxWidthInput]
  )
  const derivedPdfTitle = useMemo(() => extractMarkdownTitle(markdown), [markdown])
  const pdfDocumentTitle = pdfTitleInput.trim() || derivedPdfTitle
  const pdfFontFamily = useMemo(() => resolvePdfFontFamily(pdfFontKey), [pdfFontKey])
  const pdfMarginsMm = useMemo(
    () => ({
      top: parseNonNegativeDecimalInput(pdfMarginInputs.top, DEFAULT_PDF_MARGIN_MM.top),
      right: parseNonNegativeDecimalInput(pdfMarginInputs.right, DEFAULT_PDF_MARGIN_MM.right),
      bottom: parseNonNegativeDecimalInput(pdfMarginInputs.bottom, DEFAULT_PDF_MARGIN_MM.bottom),
      left: parseNonNegativeDecimalInput(pdfMarginInputs.left, DEFAULT_PDF_MARGIN_MM.left),
    }),
    [pdfMarginInputs]
  )
  const pdfExportLabel =
    pdfExportState === 'working'
      ? '导出中...'
      : pdfExportState === 'done'
        ? '已导出'
        : pdfExportState === 'error'
          ? '导出失败'
          : '导出 PDF'
  const contentMaxWidthLabel = contentMaxWidth ? `${contentMaxWidth}px` : '不限制'
  const previewLayoutStyle = useMemo(
    () => ({
      '--fh-content-max-width': contentMaxWidth ? `${contentMaxWidth}px` : 'none',
    }),
    [contentMaxWidth]
  )
  const themeKeys = useMemo(
    () => Object.values(themeGroups).flatMap((group) => group.themes),
    []
  )
  const themeGalleryItems = useMemo(
    () => {
      if (!isThemeGalleryOpen) return []

      return themeKeys.map((themeKey) => {
        const themeConfig = themes[themeKey]

        return {
          key: themeKey,
          label: themeConfig?.label || themeKey,
          accent: themeConfig?.accent || '#475569',
          html: buildHtmlDocument(renderedHtml, themeKey, codeTheme, isDarkCode, {
            contentMaxWidth,
            documentTitle: `${pdfDocumentTitle} - ${themeConfig?.label || themeKey}`,
          }),
        }
      })
    },
    [
      isThemeGalleryOpen,
      themeKeys,
      renderedHtml,
      codeTheme,
      isDarkCode,
      contentMaxWidth,
      pdfDocumentTitle,
    ]
  )

  // 从本地存储加载
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setMarkdown(saved)
    }
    const savedTheme = window.localStorage.getItem('format-hub.theme')
    if (savedTheme) {
      const resolvedTheme = resolveThemeKey(savedTheme)
      setTheme(resolvedTheme)
      if (resolvedTheme !== savedTheme) {
        window.localStorage.setItem('format-hub.theme', resolvedTheme)
      }
    }
    const savedCodeTheme = window.localStorage.getItem('format-hub.codeTheme')
    if (savedCodeTheme) setCodeTheme(savedCodeTheme)
    const savedShowTOC = window.localStorage.getItem('format-hub.showTOC')
    if (savedShowTOC) setShowTOC(savedShowTOC === 'true')
    const savedIsDark = window.localStorage.getItem('format-hub.isDarkCode')
    if (savedIsDark) setIsDarkCode(savedIsDark === 'true')
    const savedContentMaxWidth = window.localStorage.getItem(CONTENT_MAX_WIDTH_STORAGE_KEY)
    if (savedContentMaxWidth) {
      setContentMaxWidthInput(sanitizePositiveIntegerInput(savedContentMaxWidth))
    }
  }, [])

  // 保存到本地存储
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, markdown)
  }, [markdown])

  useEffect(() => {
    window.localStorage.setItem('format-hub.theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('format-hub.codeTheme', codeTheme)
  }, [codeTheme])

  useEffect(() => {
    window.localStorage.setItem('format-hub.showTOC', showTOC)
  }, [showTOC])

  useEffect(() => {
    window.localStorage.setItem('format-hub.isDarkCode', isDarkCode)
  }, [isDarkCode])

  useEffect(() => {
    window.localStorage.setItem(CONTENT_MAX_WIDTH_STORAGE_KEY, contentMaxWidthInput)
  }, [contentMaxWidthInput])

  // 异步渲染 Markdown
  useEffect(() => {
    let cancelled = false
    renderMarkdown(markdown, {
      includeTOC: showTOC,
      codeTheme,
      darkMode: isDarkCode,
    }).then((html) => {
      if (!cancelled) setRenderedHtml(html)
    })
    return () => {
      cancelled = true
    }
  }, [markdown, showTOC, codeTheme, isDarkCode])

  const exportHtml = useMemo(
    () =>
      buildHtmlDocument(renderedHtml, theme, codeTheme, isDarkCode, {
        contentMaxWidth,
        documentTitle: pdfDocumentTitle,
      }),
    [renderedHtml, theme, codeTheme, isDarkCode, contentMaxWidth, pdfDocumentTitle]
  )

  const exportPdfHtml = useMemo(
    () =>
      buildHtmlDocument(renderedHtml, theme, codeTheme, isDarkCode, {
        contentMaxWidth,
        documentTitle: pdfDocumentTitle,
        outputMode: 'pdf',
        pdfFontFamily,
      }),
    [renderedHtml, theme, codeTheme, isDarkCode, contentMaxWidth, pdfDocumentTitle, pdfFontFamily]
  )

  const updatePdfMarginInput = (key, value) => {
    setPdfMarginInputs((current) => ({
      ...current,
      [key]: sanitizeNonNegativeDecimalInput(value),
    }))
  }

  // 复制富文本到剪贴板（可直接粘贴到公众号编辑器）
  const handleCopy = async () => {
    try {
      const payload = buildRichClipboardPayload(previewContentRef.current)

      if (window.formatHubDesktop?.copyRichText) {
        await window.formatHubDesktop.copyRichText(payload)
      } else {
        await writeRichTextWithBrowserClipboard(payload)
      }

      setCopyState('done')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 1600)
    }
  }

  const handleDownload = () => {
    download('wechat-article.html', exportHtml)
  }

  const handlePdfDownload = async () => {
    if (!window.formatHubDesktop?.exportPdf) {
      setPdfExportState('error')
      window.setTimeout(() => setPdfExportState('idle'), 1600)
      window.alert('PDF 导出需要在桌面版应用中使用。')
      return
    }

    setPdfExportState('working')

    try {
      const result = await window.formatHubDesktop.exportPdf({
        html: exportPdfHtml,
        options: {
          title: pdfDocumentTitle,
          pageSize: pdfPageSize,
          marginsMm: pdfMarginsMm,
          headerTemplate: pdfHeaderTemplate,
          footerTemplate: pdfFooterTemplate,
        },
      })

      if (result?.canceled) {
        setPdfExportState('idle')
        return
      }

      setPdfExportState('done')
      window.setTimeout(() => setPdfExportState('idle'), 1600)
    } catch (error) {
      setPdfExportState('error')
      window.setTimeout(() => setPdfExportState('idle'), 1600)
      window.alert(error?.message || 'PDF 导出失败')
    }
  }

  const handleReset = () => {
    if (confirm('确定要重置为示例内容吗？当前内容将丢失。')) {
      setMarkdown(DEFAULT_MARKDOWN)
    }
  }

  // 渲染分组的主题选择器
  const renderThemeOptions = () => {
    return Object.entries(themeGroups).map(([groupKey, group]) => (
      <optgroup key={groupKey} label={group.label}>
        {group.themes.map((themeKey) => (
          <option key={themeKey} value={themeKey}>
            {themes[themeKey]?.label || themeKey}
          </option>
        ))}
      </optgroup>
    ))
  }

  const scenarioThemeCount = Object.values(themeGroups).reduce(
    (total, group) => total + group.themes.length,
    0
  )

  return (
    <div className="app-shell">
      <header className={`topbar${isMacPlatform ? ' topbar-macos' : ''}`}>
        <div className="brand-block">
          <img className="brand-logo" src={appLogo} alt="Format Hub logo" />
          <div className="brand-copy">
            <p className="eyebrow">Format Hub</p>
            <h1>Markdown 转公众号 HTML</h1>
            <p className="subcopy">
              {scenarioThemeCount} 个场景主题，支持表达组件、数学公式、Mermaid 图表、代码高亮。
            </p>
          </div>
        </div>

        <div className="topbar-drag-strip" aria-hidden="true" />

        <div className="toolbar">
          <label className="theme-picker">
            <span>排版主题</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              {renderThemeOptions()}
            </select>
          </label>

          <label className="theme-picker">
            <span>代码主题</span>
            <select value={codeTheme} onChange={(event) => setCodeTheme(event.target.value)}>
              {Object.entries(codeThemeList).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="theme-picker checkbox">
            <input
              type="checkbox"
              checked={isDarkCode}
              onChange={(e) => setIsDarkCode(e.target.checked)}
            />
            <span>深色代码</span>
          </label>

          <label className="theme-picker checkbox">
            <input
              type="checkbox"
              checked={showTOC}
              onChange={(e) => setShowTOC(e.target.checked)}
            />
            <span>显示目录</span>
          </label>

          <label className="theme-picker width-picker">
            <span>正文最大宽度</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={contentMaxWidthInput}
              onChange={(event) =>
                setContentMaxWidthInput(sanitizePositiveIntegerInput(event.target.value))
              }
              placeholder="不限制"
              aria-label="正文最大宽度（像素，留空为不限制）"
            />
            <span className="theme-picker-unit">px</span>
          </label>

          <button className="button button-secondary" onClick={handleReset}>
            重置
          </button>
          <button className="button button-secondary" onClick={handleDownload}>
            导出 HTML
          </button>
          <button
            className="button button-secondary"
            onClick={() => setIsThemeGalleryOpen((current) => !current)}
            aria-expanded={isThemeGalleryOpen}
          >
            主题样张
          </button>
          <button
            className="button button-secondary"
            onClick={() => setIsPdfSettingsOpen((current) => !current)}
          >
            PDF 设置
          </button>
          <button
            className="button button-secondary"
            onClick={handlePdfDownload}
            disabled={pdfExportState === 'working'}
          >
            {pdfExportLabel}
          </button>
          <button className="button button-primary" onClick={handleCopy}>
            {copyState === 'done'
              ? '已复制'
              : copyState === 'error'
                ? '复制失败'
                : '复制到公众号'}
          </button>
        </div>
      </header>

      {isThemeGalleryOpen && (
        <section className="theme-gallery-panel" aria-label="主题样张库">
          <div className="theme-gallery-head">
            <div>
              <h2>主题样张</h2>
              <p>同一篇 Markdown 在 8 个场景主题下的缩略预览，点击即可切换。</p>
            </div>
            <button
              className="button button-secondary theme-gallery-close"
              onClick={() => setIsThemeGalleryOpen(false)}
            >
              收起
            </button>
          </div>

          <div className="theme-gallery-grid">
            {themeGalleryItems.map((item) => {
              const isSelected = item.key === theme

              return (
                <button
                  key={item.key}
                  className={`theme-sample${isSelected ? ' theme-sample-selected' : ''}`}
                  style={{ '--theme-accent': item.accent }}
                  onClick={() => setTheme(item.key)}
                  type="button"
                >
                  <span className="theme-sample-head">
                    <span>{item.label}</span>
                    <span className="theme-sample-status">{isSelected ? '当前' : '选择'}</span>
                  </span>
                  <span className="theme-sample-frame">
                    <iframe
                      title={`${item.label} 样张`}
                      srcDoc={item.html}
                      sandbox=""
                      tabIndex={-1}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {isPdfSettingsOpen && (
        <section className="pdf-settings-panel" aria-label="PDF 设置">
          <label className="pdf-setting pdf-setting-wide">
            <span>标题</span>
            <input
              type="text"
              value={pdfTitleInput}
              onChange={(event) => setPdfTitleInput(event.target.value)}
              placeholder={derivedPdfTitle}
            />
          </label>

          <label className="pdf-setting">
            <span>纸张</span>
            <select value={pdfPageSize} onChange={(event) => setPdfPageSize(event.target.value)}>
              {PDF_PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize.value} value={pageSize.value}>
                  {pageSize.label}
                </option>
              ))}
            </select>
          </label>

          <label className="pdf-setting">
            <span>字体</span>
            <select value={pdfFontKey} onChange={(event) => setPdfFontKey(event.target.value)}>
              {PDF_FONT_OPTIONS.map((font) => (
                <option key={font.key} value={font.key}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>

          <label className="pdf-setting pdf-setting-wide">
            <span>页眉</span>
            <input
              type="text"
              value={pdfHeaderTemplate}
              onChange={(event) => setPdfHeaderTemplate(event.target.value)}
              placeholder={DEFAULT_PDF_HEADER_TEMPLATE}
            />
          </label>

          <label className="pdf-setting pdf-setting-wide">
            <span>页脚</span>
            <input
              type="text"
              value={pdfFooterTemplate}
              onChange={(event) => setPdfFooterTemplate(event.target.value)}
              placeholder={DEFAULT_PDF_FOOTER_TEMPLATE}
            />
          </label>

          <div className="pdf-margin-grid" aria-label="PDF 页边距">
            {PDF_MARGIN_FIELDS.map((field) => (
              <label key={field.key} className="pdf-setting pdf-margin-setting">
                <span>{field.label}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pdfMarginInputs[field.key]}
                  onChange={(event) => updatePdfMarginInput(field.key, event.target.value)}
                />
                <span className="pdf-setting-unit">mm</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <main className="workspace">
        <section className="panel editor-panel">
          <div className="panel-head">
            <div>
              <h2>Markdown</h2>
              <p>
                支持标题、列表、表格、代码块、图片、引用、表达组件、数学公式、Mermaid 图表，以及
                <code>{'{{时间标记}}'}</code>。
              </p>
            </div>
          </div>

          <textarea
            className="editor"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="把 Markdown 内容粘贴到这里"
            spellCheck={false}
          />
        </section>

        <section className="panel preview-panel">
          <div className="panel-head">
            <div>
              <h2>公众号预览</h2>
              <p>
                当前主题：{themes[theme]?.label || theme} / 代码：{codeThemeList[codeTheme]?.label} /
                正文宽度：{contentMaxWidthLabel}
              </p>
            </div>
            <span className="theme-badge" style={{ '--theme-accent': themes[theme]?.accent }}>
              {themes[theme]?.label || theme}
            </span>
          </div>

          <div className="preview-canvas">
            <div className="preview-stage" style={previewLayoutStyle}>
              <div className="article-card">
                <style>{themes[theme]?.css(codeTheme, isDarkCode)}</style>
                <div
                  ref={previewContentRef}
                  className="wx-content"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
