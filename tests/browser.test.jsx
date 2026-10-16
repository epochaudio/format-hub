import React from 'react'
import { createRoot } from 'react-dom/client'
import mermaid from 'mermaid'
import katex from 'katex'
import { renderMarkdown } from '../src/core/markdown'
import { buildRichClipboardPayload, normalizeTextAlign } from '../src/core/clipboard'
import { buildHtmlDocument, themes, themeGroups } from '../src/themes'
import App from '../src/App'
import { buildWechatPayload, buildWechatDocument } from '../src/core/wechat'

const assert = (condition, message) => { if (!condition) throw new Error(message) }
const parse = (html) => new DOMParser().parseFromString(html, 'text/html')
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return
    await delay(20)
  }
  throw new Error('等待状态超时')
}
const results = []
async function test(name, run) {
  try { await run(); results.push({ name, ok: true }) }
  catch (error) { results.push({ name, ok: false, error: error.stack }) }
}
window.testResults = (async () => {
  await test('用户段落在八个主题复制后保持比例行高，调大字号仍不重叠', async () => {
    const input = '&#x20;格莱美把它归入"爵士融合"。这个标签当然没有错，但也几乎没有任何信息量。《First Circle》真正做到的事情，用一句话概括就是：**用极高的作曲复杂度，制造一种毫不复杂的情绪体验。**'
    const html = await renderMarkdown(input)
    for (const key of Object.values(themeGroups).flatMap(group => group.themes)) {
      const host = document.createElement('div')
      host.innerHTML = `<style>${themes[key].css('github', false)}</style><section class="wx-content" style="width:320px">${html}</section>`
      document.body.append(host)
      try {
        const paragraph = host.querySelector('p')
        const style = getComputedStyle(paragraph)
        assert(parseFloat(style.lineHeight) >= parseFloat(style.fontSize), '原文行高过小')
        const originalText = paragraph.textContent
        const payload = buildRichClipboardPayload(host.querySelector('.wx-content'))
        const pasted = document.createElement('div')
        pasted.innerHTML = payload.html
        document.body.append(pasted)
        try {
          const pastedParagraph = pasted.querySelector('p')
          const pastedBold = pasted.querySelector('strong')
          assert(pastedParagraph.textContent === originalText, '复制改写了用户原文')
          assert(pastedBold.textContent === '用极高的作曲复杂度，制造一种毫不复杂的情绪体验。', '加粗内容改变')
          assert(pastedParagraph.style.lineHeight === String(parseFloat(style.lineHeight) / parseFloat(style.fontSize)), '未输出比例行高')
          assert(Math.abs(parseFloat(getComputedStyle(pastedParagraph).lineHeight) - parseFloat(style.lineHeight)) < 0.01, '原始段落间距改变')
          for (const element of [pastedParagraph, pastedBold]) {
            element.style.fontSize = '40px'
            const enlarged = getComputedStyle(element)
            assert(parseFloat(enlarged.lineHeight) >= parseFloat(enlarged.fontSize), '调大字号后行高小于字号')
          }
        } finally { pasted.remove() }
      } finally { host.remove() }
    }
  })
  await test('修正普通文字的过小行高，保留公式与 SVG 的定位行高', () => {
    const host = document.createElement('section')
    host.innerHTML = '<p style="font-size:20px;line-height:8px">普通文字<br>第二行</p><span class="katex"><span class="smash" style="font-size:20px;line-height:0px">x</span></span><svg><text style="font-size:20px;line-height:0px">图表</text></svg>'
    document.body.append(host)
    try {
      const copied = parse(buildRichClipboardPayload(host).html)
      assert(copied.querySelector('p').style.lineHeight === '1.5', '未修正普通文字过小行高')
      assert(copied.querySelector('.smash').style.lineHeight === '0px', '公式行高被修改')
      assert(copied.querySelector('svg text').style.lineHeight === '0px', 'SVG 行高被修改')
    } finally { host.remove() }
  })
  await test('公众号共用输出清理字体和渐变，代码换行且原文不变', async () => {
    const host = document.createElement('section')
    host.style.cssText = 'font-family:serif;background-image:linear-gradient(red,blue);width:320px;'
    host.innerHTML = await renderMarkdown('正文 **重点**\n\n```js\nconst longValue = "' + 'x'.repeat(150) + '"\n```')
    document.body.append(host)
    const original = host.innerHTML
    try {
      const payload = await buildWechatPayload(host)
      const doc = parse(payload.html)
      assert(!doc.querySelector('pre'), '公众号仍输出 pre')
      assert(!payload.html.includes('font-family:'), '仍有自定义字体')
      assert(!payload.html.includes('gradient('), '仍有渐变背景')
      assert(doc.querySelector('code').textContent === host.querySelector('code').textContent, '代码原文被改写')
      assert(doc.querySelector('strong').textContent === '重点', '加粗丢失')
      assert(doc.querySelector('[data-code-block]').style.whiteSpace === 'pre-wrap', '代码未设置换行')
      const exported = parse(buildWechatDocument(payload, '<文章>'))
      assert(exported.body.innerHTML === doc.body.innerHTML, '复制和 HTML 内容不一致')
      assert(exported.title === '<文章>', '导出标题未正确转义')
      assert(host.innerHTML === original, '修改了原始预览')
    } finally { host.remove() }
  })
  await test('公众号公式转为非空高清图片，原始公式仍保留', async () => {
    const host = document.createElement('section')
    host.style.cssText = 'font-size:18px;line-height:1.75;width:640px;'
    host.innerHTML = await renderMarkdown('公式 $E=mc^2$\n\n$$\\frac{a+b}{c}$$')
    document.body.append(host)
    try {
      const payload = await buildWechatPayload(host)
      const doc = parse(payload.html)
      assert(!doc.querySelector('.katex'), '公众号仍保留公式定位结构')
      assert(doc.querySelectorAll('img').length === 2, '公式图片缺失')
      assert(host.querySelectorAll('.katex').length === 2, '原始公式被改写')
      for (const exported of doc.querySelectorAll('img')) {
        assert(exported.src.startsWith('data:image/png;base64,'), '公式图片不自包含')
        const image = new Image()
        await new Promise((resolve,reject) => { image.onload=resolve;image.onerror=reject;image.src=exported.src })
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
        const context=canvas.getContext('2d');context.drawImage(image,0,0)
        const pixels=context.getImageData(0,0,canvas.width,canvas.height).data
        let ink=0
        for(let i=0;i<pixels.length;i+=4) if(pixels[i]<180 && pixels[i+1]<180 && pixels[i+2]<180) ink++
        assert(ink>20, '公式图片为空白')
        assert(image.width >= parseFloat(exported.style.width)*3, '公式图片分辨率不足')
        assert(parseFloat(exported.style.width) < 300, '公式图片不应包含整行空白而在窄屏缩小')
      }
    } finally { host.remove() }
  })
  await test('代码高亮保持原文，不嵌套破坏标签', async () => {
    const code = 'const x = 1;\nconst label = "<span>&quot;</span>"; // return 42'
    const doc = parse(await renderMarkdown('```js\n' + code + '\n```'))
    assert(doc.querySelector('code').textContent === code, '高亮后代码原文改变')
    assert(doc.querySelector('.keyword').textContent === 'const', '关键字高亮异常')
    assert(doc.querySelectorAll('code span span').length === 0, '高亮标签重复处理')
  })
  await test('扩展语法保留围栏、缩进和行内代码', async () => {
    const code = 'a == b && c == d; $x$; {{时间}}'
    for (const input of ['```js\n' + code + '\n```', '~~~\n' + code + '\n~~~', '    ' + code, '`' + code + '`']) {
      const doc = parse(await renderMarkdown(input))
      assert(doc.querySelector('code').textContent === code, `代码被改写：${input}`)
      assert(!doc.querySelector('code .katex, code mark, code .timeline-token'), '代码内误触发扩展')
    }
  })
  await test('正文和表达组件仍支持高亮与公式', async () => {
    const input = '==**重点**== 和 $E=mc^2$\n\n$$\nx^2\n$$\n\n:::note 提示\n==内容== $y$\n:::'
    const doc = parse(await renderMarkdown(input))
    assert(doc.querySelectorAll('mark').length === 2, '高亮丢失')
    assert(doc.querySelectorAll('.katex').length === 3, '公式丢失')
    assert(doc.querySelector('.katex-display'), '块级公式显示模式错误')
    assert(doc.querySelector('.content-block-note .katex'), '表达组件内公式丢失')
  })
  await test('超过十个表达组件时内容和顺序不错位', async () => {
    const input = Array.from({ length: 12 }, (_, index) => `:::note 标题${index}\n内容${index}\n:::`).join('\n\n')
    const doc = parse(await renderMarkdown(input))
    const titles = [...doc.querySelectorAll('.content-block-title')].map(node => node.textContent)
    const bodies = [...doc.querySelectorAll('.content-block-body')].map(node => node.textContent.trim())
    assert(titles.join() === Array.from({ length: 12 }, (_, index) => `标题${index}`).join(), `组件标题错位：${titles.join()}`)
    assert(bodies.join() === Array.from({ length: 12 }, (_, index) => `内容${index}`).join(), `组件内容错位：${bodies.join()}`)
  })
  await test('表达组件内的美元替换符原样保留', async () => {
    const code = "echo $$ $& $' $` $1 done"
    const doc = parse(await renderMarkdown(':::steps 步骤\n```bash\n' + code + '\n```\n\n行内 `` ' + code + ' ``\n:::'))
    const codes = [...doc.querySelectorAll('.content-block code')].map(node => node.textContent.trim())
    assert(codes.length === 2 && codes.every(text => text === code), `组件内代码被改写：${codes.join(' | ')}`)
  })
  await test('表达组件紧跟段落或列表时仍能开启', async () => {
    for (const input of ['前文段落\n:::note 提示\n组件内容\n:::', '- 列表项\n:::note 提示\n组件内容\n:::']) {
      const doc = parse(await renderMarkdown(input))
      assert(doc.querySelector('.content-block-note .content-block-body')?.textContent.trim() === '组件内容', `未开启组件：${input}`)
      assert(!doc.body.textContent.includes(':::'), `组件标记残留：${input}`)
    }
  })
  await test('代码中的脚注语法原样保留，脚注定义可紧跟段落', async () => {
    const doc = parse(await renderMarkdown('正文引用[^a]和未定义[^none]\n[^a]: 脚注 **加粗**\n\n语法 `[^a]`\n\n```md\n正文[^a]\n[^a]: 定义\n```'))
    assert(doc.querySelector('p code').textContent === '[^a]', '行内代码中的脚注被改写')
    assert(doc.querySelector('pre code').textContent === '正文[^a]\n[^a]: 定义', '代码块中的脚注被改写')
    assert(doc.querySelectorAll('sup a[href="#footnote-a"]').length === 1, '正文脚注引用缺失')
    assert(doc.body.textContent.includes('未定义[^none]'), '未定义脚注应原样显示')
    assert(doc.querySelector('.footnotes li strong')?.textContent === '加粗', '脚注内容未按 Markdown 渲染')
    assert(!doc.querySelector('p:first-child')?.textContent.includes('脚注 加粗'), '脚注定义混入正文')
  })
  await test('嵌套围栏中的 mermaid 示例按代码显示', async () => {
    const inner = '```mermaid\ngraph TD\n  A-->B\n```'
    const doc = parse(await renderMarkdown('````markdown\n' + inner + '\n````'))
    assert(!doc.querySelector('.mermaid-chart'), '示例代码被渲染成图表')
    assert(doc.querySelector('code').textContent === inner, '示例代码被改写')
  })
  await test('美元金额不误判为公式，常规公式照常渲染', async () => {
    const money = parse(await renderMarkdown('门票 $5 起，套票 $10 封顶；价格$5和$10。'))
    assert(money.querySelectorAll('.katex').length === 0, '美元金额被渲染成公式')
    assert(money.body.textContent.includes('门票 $5 起，套票 $10 封顶；价格$5和$10。'), '金额文字被改写')
    const math = parse(await renderMarkdown('公式 $x$、$E=mc^2$ 与 $\\sqrt{2}$。'))
    assert(math.querySelectorAll('.katex').length === 3, '常规行内公式丢失')
  })
  await test('Mermaid 图表保留文字、箭头和样式', async () => {
    const doc = parse(await renderMarkdown('```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```'))
    const svg = doc.querySelector('.mermaid-chart svg')
    assert(svg, '图表缺失')
    assert(svg.textContent.includes('开始') && svg.textContent.includes('结束'), '节点文字丢失')
    assert(svg.querySelector('marker[refX], marker[refx]'), '箭头定义丢失')
    assert(svg.querySelector('style'), '图表样式丢失')
    assert(!svg.querySelector('foreignObject, foreignobject'), '标签不应依赖 foreignObject')
  })
  await test('KaTeX 可伸缩符号在过滤后保留全部属性', async () => {
    const attributes = (root) => new Set([...root.querySelectorAll('*')].flatMap(element => [...element.attributes].map(attribute => `${element.localName}@${attribute.name}=${attribute.value}`)))
    for (const formula of ['\\sqrt{x+1}', '\\overrightarrow{AB}', '\\widehat{xyz}', '\\xrightarrow{f}', '\\underbrace{a+b}_{n}', '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}']) {
      const raw = parse(katex.renderToString(formula, { displayMode: true, throwOnError: false })).querySelector('.katex-html')
      const rendered = parse(await renderMarkdown('$$' + formula + '$$')).querySelector('.katex-html')
      const missing = [...attributes(raw)].filter(attribute => !attributes(rendered).has(attribute) && !attribute.startsWith('svg@xmlns'))
      assert(missing.length === 0, `${formula} 丢失属性：${missing.join(', ')}`)
    }
  })
  await test('微信对齐转换遵循文字方向并保留明确对齐', () => {
    for (const [value, direction, expected] of [
      ['start', 'ltr', 'left'], ['end', 'ltr', 'right'], ['start', 'rtl', 'right'], ['end', 'rtl', 'left'],
      ['center', 'ltr', 'center'], ['justify', 'ltr', 'justify'], ['right', 'ltr', 'right'],
    ]) assert(normalizeTextAlign(value, direction) === expected, `${value}/${direction}`)
    const root = document.createElement('section')
    root.innerHTML = '<p>默认对齐</p><p style="direction:rtl;text-align:start">RTL</p><p style="text-align:center">居中</p>'
    document.body.append(root)
    try {
      const copy = parse(buildRichClipboardPayload(root).html)
      const paragraphs = copy.querySelectorAll('p')
      assert(paragraphs[0].style.textAlign === 'left', '默认对齐未转换')
      assert(paragraphs[1].style.textAlign === 'right', 'RTL 对齐错误')
      assert(paragraphs[2].style.textAlign === 'center', '居中丢失')
      assert(!/text-align:\s*(start|end)/.test(copy.body.innerHTML), '仍有逻辑对齐值')
    } finally { root.remove() }
  })
  await test('独立 HTML 公式字体全部内嵌，离线可加载', async () => {
    const html = buildHtmlDocument(await renderMarkdown('$E=mc^2$'), 'default', 'github', false, { outputMode: 'standalone' })
    const urls = [...html.matchAll(/url\(([^)]+)\)/g)].map(match => match[1])
    assert(urls.length > 10, '未找到公式字体')
    assert(urls.every(url => url.startsWith('data:font/woff2;base64,')), '仍存在外部字体路径')
    const frame = document.createElement('iframe')
    const loaded = new Promise(resolve => { frame.onload = resolve })
    frame.srcdoc = html
    document.body.append(frame)
    try {
      await loaded
      await frame.contentDocument.fonts.ready
      await frame.contentDocument.fonts.load('16px KaTeX_Main')
      assert(frame.contentDocument.fonts.check('16px KaTeX_Main'), '内嵌字体加载失败')
    } finally { frame.remove() }
  })
  await test('StrictMode 重挂载保留已有草稿和空草稿', async () => {
    for (const draft of ['# 我的草稿\n\n不能覆盖', '']) {
      localStorage.clear()
      localStorage.setItem('format-hub.markdown', draft)
      localStorage.setItem('format-hub.isDarkCode', 'true')
      const host = document.createElement('div')
      document.body.append(host)
      const root = createRoot(host)
      try {
        root.render(<React.StrictMode><App /></React.StrictMode>)
        await waitFor(() => host.querySelector('textarea'))
        await delay(100)
        assert(host.querySelector('textarea').value === draft, '编辑器草稿被覆盖')
        assert(localStorage.getItem('format-hub.markdown') === draft, '存储草稿被覆盖')
        assert(localStorage.getItem('format-hub.isDarkCode') === 'true', '设置被覆盖')
      } finally { root.unmount(); host.remove() }
    }
  })
  await test('渲染等待时禁用全部导出，迟到结果不覆盖新内容', async () => {
    localStorage.setItem('format-hub.markdown', '# 初始文章')
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const originalRender = mermaid.render
    let finish
    mermaid.render = () => new Promise(resolve => { finish = resolve })
    try {
      root.render(<App />)
      const exportButtons = () => [...host.querySelectorAll('button')].filter(button => ['公众号 HTML', '阅读版 HTML', '导出 PDF', '复制到公众号'].includes(button.textContent))
      await waitFor(() => exportButtons().length === 4 && exportButtons().every(button => !button.disabled))
      const textarea = host.querySelector('textarea')
      const update = (value) => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, value)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
      update('```mermaid\ngraph TD\nA-->B\n```')
      await waitFor(() => finish)
      assert(exportButtons().every(button => button.disabled), '渲染中仍可导出旧内容')
      update('# 最新文章')
      await waitFor(() => host.querySelector('.wx-content').textContent.includes('最新文章'))
      finish({ svg: '<svg><text>过期图表</text></svg>' })
      await delay(50)
      assert(!host.querySelector('.wx-content').textContent.includes('过期'), '过期结果覆盖新内容')
      assert(exportButtons().every(button => !button.disabled), '完成后导出仍禁用')
    } finally { mermaid.render = originalRender; root.unmount(); host.remove() }
  })
  await test('排版期间编辑区位置不变', async () => {
    localStorage.setItem('format-hub.markdown', '# 布局文章')
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const originalRender = mermaid.render
    let finish
    mermaid.render = () => new Promise(resolve => { finish = resolve })
    try {
      root.render(<App />)
      await waitFor(() => host.querySelector('.wx-content')?.textContent.includes('布局文章') && host.querySelector('.render-status')?.textContent.includes('就绪'))
      const workspaceTop = () => host.querySelector('.workspace').getBoundingClientRect().top
      const before = workspaceTop()
      const textarea = host.querySelector('textarea')
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, '```mermaid\ngraph TD\nLayoutA-->LayoutB\n```')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await waitFor(() => finish)
      assert(host.querySelector('.render-status').textContent.includes('正在排版'), '未提示排版中')
      assert(workspaceTop() === before, `排版提示改变了编辑区位置：${before} → ${workspaceTop()}`)
      finish({ svg: '<svg><text>布局</text></svg>' })
    } finally { mermaid.render = originalRender; root.unmount(); host.remove() }
  })
  return results
})()
