import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// 导出的 HTML 必须独立可移植，公式字体不引用应用安装路径或开发服务器。
// 替换限定在单个 @font-face 块内：压缩后的 src 是块内最后一条声明，以 } 而不是 ; 结尾。
export function buildPortableKatexCss() {
  const cssPath = require.resolve('katex/dist/katex.min.css')
  const portableCss = fs.readFileSync(cssPath, 'utf8').replace(/@font-face\{[^}]*\}/g, (fontFace) => {
    const font = fontFace.match(/url\(([^)]+\.woff2)\)/)
    if (!font) throw new Error('KaTeX 字体声明缺少 WOFF2 资源')
    const fontPath = path.resolve(path.dirname(cssPath), font[1])
    const data = fs.readFileSync(fontPath).toString('base64')
    return fontFace.replace(/src:[^;}]+/, `src:url(data:font/woff2;base64,${data}) format("woff2")`)
  })
  if (/url\((?!data:)/.test(portableCss)) throw new Error('KaTeX 样式仍引用外部字体文件')
  return portableCss
}

export function portableKatexPlugin() {
  const moduleId = 'virtual:format-hub-katex-css'
  const resolvedId = `\0${moduleId}`
  return {
    name: 'format-hub-portable-katex',
    resolveId(id) { if (id === moduleId) return resolvedId },
    load(id) {
      if (id === resolvedId) return `export default ${JSON.stringify(buildPortableKatexCss())}`
    },
  }
}
