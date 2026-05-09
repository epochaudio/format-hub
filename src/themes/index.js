import { codeThemes } from '../core/markdown'
import katexCss from 'katex/dist/katex.min.css?inline'

export { codeThemes }

// 颜色配置
const colors = {
  gold: { accent: '#d97706', light: '#fef3c7', dark: '#92400e', border: '#fcd34d' },
  green: { accent: '#16a34a', light: '#dcfce7', dark: '#166534', border: '#86efac' },
  blue: { accent: '#2563eb', light: '#dbeafe', dark: '#1e40af', border: '#93c5fd' },
  orange: { accent: '#ea580c', light: '#ffedd5', dark: '#9a3412', border: '#fdba74' },
  red: { accent: '#dc2626', light: '#fee2e2', dark: '#991b1b', border: '#fca5a5' },
  navy: { accent: '#1e3a8a', light: '#e0e7ff', dark: '#1e3a8a', border: '#a5b4fc' },
  gray: { accent: '#4b5563', light: '#f3f4f6', dark: '#374151', border: '#d1d5db' },
  sky: { accent: '#0284c7', light: '#e0f2fe', dark: '#0369a1', border: '#7dd3fc' },
  purple: { accent: '#9333ea', light: '#f3e8ff', dark: '#6b21a8', border: '#d8b4fe' },
  rose: { accent: '#e11d48', light: '#ffe4e6', dark: '#be123c', border: '#fda4af' },
  teal: { accent: '#0d9488', light: '#ccfbf1', dark: '#0f766e', border: '#5eead4' },
  indigo: { accent: '#4f46e5', light: '#e0e7ff', dark: '#3730a3', border: '#a5b4fc' },
}

const contentWidthRule = 'max-width: var(--fh-content-max-width, none);'

// Minimal 系列：干净克制，纯色文字无装饰
const minimalThemes = {
  'minimal-gold': {
    label: 'Minimal · 金',
    series: 'minimal',
    color: 'gold',
    ...colors.gold,
  },
  'minimal-green': {
    label: 'Minimal · 绿',
    series: 'minimal',
    color: 'green',
    ...colors.green,
  },
  'minimal-blue': {
    label: 'Minimal · 蓝',
    series: 'minimal',
    color: 'blue',
    ...colors.blue,
  },
  'minimal-orange': {
    label: 'Minimal · 橙',
    series: 'minimal',
    color: 'orange',
    ...colors.orange,
  },
  'minimal-red': {
    label: 'Minimal · 红',
    series: 'minimal',
    color: 'red',
    ...colors.red,
  },
  'minimal-navy': {
    label: 'Minimal · 藏青',
    series: 'minimal',
    color: 'navy',
    ...colors.navy,
  },
  'minimal-gray': {
    label: 'Minimal · 灰',
    series: 'minimal',
    color: 'gray',
    ...colors.gray,
  },
  'minimal-sky': {
    label: 'Minimal · 天蓝',
    series: 'minimal',
    color: 'sky',
    ...colors.sky,
  },
}

// Focus 系列：居中对称，标题上下双横线
const focusThemes = {
  'focus-gold': {
    label: 'Focus · 金',
    series: 'focus',
    color: 'gold',
    ...colors.gold,
  },
  'focus-green': {
    label: 'Focus · 绿',
    series: 'focus',
    color: 'green',
    ...colors.green,
  },
  'focus-blue': {
    label: 'Focus · 蓝',
    series: 'focus',
    color: 'blue',
    ...colors.blue,
  },
  'focus-orange': {
    label: 'Focus · 橙',
    series: 'focus',
    color: 'orange',
    ...colors.orange,
  },
  'focus-red': {
    label: 'Focus · 红',
    series: 'focus',
    color: 'red',
    ...colors.red,
  },
  'focus-navy': {
    label: 'Focus · 藏青',
    series: 'focus',
    color: 'navy',
    ...colors.navy,
  },
  'focus-purple': {
    label: 'Focus · 紫',
    series: 'focus',
    color: 'purple',
    ...colors.purple,
  },
  'focus-teal': {
    label: 'Focus · 青',
    series: 'focus',
    color: 'teal',
    ...colors.teal,
  },
}

// Elegant 系列：层次丰富，左边框递减 + 渐变背景
const elegantThemes = {
  'elegant-gold': {
    label: 'Elegant · 金',
    series: 'elegant',
    color: 'gold',
    ...colors.gold,
  },
  'elegant-purple': {
    label: 'Elegant · 紫',
    series: 'elegant',
    color: 'purple',
    ...colors.purple,
  },
  'elegant-rose': {
    label: 'Elegant · 玫瑰',
    series: 'elegant',
    color: 'rose',
    ...colors.rose,
  },
  'elegant-green': {
    label: 'Elegant · 绿',
    series: 'elegant',
    color: 'green',
    ...colors.green,
  },
  'elegant-blue': {
    label: 'Elegant · 蓝',
    series: 'elegant',
    color: 'blue',
    ...colors.blue,
  },
  'elegant-orange': {
    label: 'Elegant · 橙',
    series: 'elegant',
    color: 'orange',
    ...colors.orange,
  },
  'elegant-teal': {
    label: 'Elegant · 青',
    series: 'elegant',
    color: 'teal',
    ...colors.teal,
  },
  'elegant-indigo': {
    label: 'Elegant · 靛蓝',
    series: 'elegant',
    color: 'indigo',
    ...colors.indigo,
  },
}

// Bold 系列：视觉冲击，标题满底色 + 圆角投影
const boldThemes = {
  'bold-orange': {
    label: 'Bold · 橙',
    series: 'bold',
    color: 'orange',
    ...colors.orange,
  },
  'bold-red': {
    label: 'Bold · 红',
    series: 'bold',
    color: 'red',
    ...colors.red,
  },
  'bold-purple': {
    label: 'Bold · 紫',
    series: 'bold',
    color: 'purple',
    ...colors.purple,
  },
  'bold-blue': {
    label: 'Bold · 蓝',
    series: 'bold',
    color: 'blue',
    ...colors.blue,
  },
  'bold-green': {
    label: 'Bold · 绿',
    series: 'bold',
    color: 'green',
    ...colors.green,
  },
  'bold-gold': {
    label: 'Bold · 金',
    series: 'bold',
    color: 'gold',
    ...colors.gold,
  },
  'bold-navy': {
    label: 'Bold · 藏青',
    series: 'bold',
    color: 'navy',
    ...colors.navy,
  },
  'bold-teal': {
    label: 'Bold · 青',
    series: 'bold',
    color: 'teal',
    ...colors.teal,
  },
}

// Classic 系列：经典风格（保留原有主题）
const classicThemes = {
  journal: {
    label: 'Classic · 杂志风',
    series: 'classic',
    accent: '#c2410c',
    light: '#fff7f2',
    dark: '#9a3412',
    border: '#f5c6a5',
  },
  slate: {
    label: 'Classic · 冷静科技',
    series: 'classic',
    accent: '#0f766e',
    light: '#ecfeff',
    dark: '#155e75',
    border: '#99f6e4',
  },
  paper: {
    label: 'Classic · 简报风',
    series: 'classic',
    accent: '#1d4ed8',
    light: '#eff6ff',
    dark: '#1e40af',
    border: '#dbeafe',
  },
}

// 合并所有主题
const allThemes = {
  ...classicThemes,
  ...minimalThemes,
  ...focusThemes,
  ...elegantThemes,
  ...boldThemes,
}

function buildTimelineTokenCSS({ accent, light, dark, border }) {
  return `
    .wx-content .timeline-token {
      display: inline-block;
      margin: 0 0.08em;
      padding: 0.08em 0.52em;
      color: ${accent};
      background: ${light};
      border: 1px solid ${border};
      border-radius: 999px;
      font-size: 0.92em;
      font-weight: 600;
      line-height: 1.45;
      letter-spacing: 0.01em;
      white-space: nowrap;
      vertical-align: baseline;
      box-sizing: border-box;
    }
    .wx-content .timeline-token strong {
      color: ${dark};
    }
  `
}

// 生成 Minimal 系列 CSS
function generateMinimalCSS(color, codeTheme = 'github', isDark = false) {
  const ct = codeThemes[codeTheme]
  const codeStyles = isDark && ct.dark ? ct.dark : ct.light || ct.dark
  return `
    .wx-content {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #374151;
      ${contentWidthRule}
      margin: 0 auto;
      line-height: 1.75;
    }
    .wx-content h1 {
      font-size: 28px;
      margin: 0 0 24px;
      color: ${color.dark};
      font-weight: 600;
    }
    .wx-content h2 {
      font-size: 20px;
      margin: 32px 0 16px;
      color: ${color.accent};
      font-weight: 600;
      padding-bottom: 8px;
      border-bottom: 1px solid ${color.border};
    }
    .wx-content h3 {
      font-size: 17px;
      margin: 24px 0 12px;
      color: ${color.dark};
      font-weight: 600;
    }
    .wx-content p,
    .wx-content li {
      font-size: 16px;
    }
    .wx-content p {
      margin: 16px 0;
    }
    .wx-content blockquote {
      margin: 24px 0;
      padding: 12px 20px;
      color: #6b7280;
      border-left: 3px solid ${color.border};
      background: ${color.light};
    }
    .wx-content code {
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 0.9em;
      color: ${color.accent};
      background: ${color.light};
      border-radius: 4px;
      padding: 2px 6px;
    }
    .wx-content pre {
      margin: 20px 0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    .wx-content pre code {
      color: inherit;
      background: transparent;
      padding: 0;
      font-size: inherit;
    }
    ${codeStyles}
    .wx-content a {
      color: ${color.accent};
      text-decoration: none;
      border-bottom: 1px solid ${color.border};
    }
    .wx-content mark {
      background: ${color.light};
      color: ${color.dark};
      padding: 0 4px;
      border-radius: 2px;
    }
    .wx-content table {
      width: 100%;
      margin: 24px 0;
      border-collapse: collapse;
      font-size: 15px;
    }
    .wx-content th,
    .wx-content td {
      border: 1px solid ${color.border};
      padding: 10px 12px;
      text-align: left;
    }
    .wx-content th {
      background: ${color.light};
      color: ${color.dark};
      font-weight: 600;
    }
    .wx-content img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 24px auto;
      border-radius: 8px;
    }
    .wx-content ul,
    .wx-content ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .wx-content hr {
      border: none;
      border-top: 1px solid ${color.border};
      margin: 32px 0;
    }
    .wx-content .katex { font-size: 1.1em; }
    .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
    .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
    .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
    .wx-content .footnotes li { font-size: 14px; }
    .wx-content .footnotes a { color: ${color.accent}; border-bottom: none; }
    .wx-content .toc a:hover { color: ${color.accent}; }
    ${buildTimelineTokenCSS(color)}
  `
}

// 生成 Focus 系列 CSS
function generateFocusCSS(color, codeTheme = 'github', isDark = false) {
  const ct = codeThemes[codeTheme]
  const codeStyles = isDark && ct.dark ? ct.dark : ct.light || ct.dark
  return `
    .wx-content {
      font-family: "PingFang SC", "Helvetica Neue", sans-serif;
      color: #374151;
      ${contentWidthRule}
      margin: 0 auto;
      line-height: 1.85;
    }
    .wx-content h1 {
      font-size: 28px;
      margin: 0 0 28px;
      color: ${color.dark};
      font-weight: 700;
      text-align: center;
      padding: 16px 0;
      border-top: 3px solid ${color.accent};
      border-bottom: 3px solid ${color.accent};
    }
    .wx-content h2 {
      font-size: 21px;
      margin: 36px 0 16px;
      color: ${color.accent};
      font-weight: 600;
      text-align: center;
      padding: 12px 0;
      border-top: 1px solid ${color.border};
      border-bottom: 1px solid ${color.border};
    }
    .wx-content h3 {
      font-size: 18px;
      margin: 28px 0 12px;
      color: ${color.dark};
      font-weight: 600;
      text-align: center;
    }
    .wx-content p,
    .wx-content li {
      font-size: 16px;
    }
    .wx-content p {
      margin: 16px 0;
    }
    .wx-content blockquote {
      margin: 24px 0;
      padding: 16px 24px;
      background: ${color.light};
      border-left: 4px solid ${color.accent};
      font-style: italic;
    }
    .wx-content code {
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 0.9em;
      color: ${color.accent};
      background: ${color.light};
      border-radius: 4px;
      padding: 2px 6px;
    }
    .wx-content pre {
      margin: 20px 0;
      padding: 18px;
      border-radius: 12px;
      overflow-x: auto;
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    .wx-content pre code {
      color: inherit;
      background: transparent;
      padding: 0;
      font-size: inherit;
    }
    ${codeStyles}
    .wx-content a {
      color: ${color.accent};
      text-decoration: none;
      border-bottom: 1px solid ${color.border};
    }
    .wx-content mark {
      background: ${color.light};
      color: ${color.dark};
      padding: 0 4px;
    }
    .wx-content table {
      width: 100%;
      margin: 24px 0;
      border-collapse: collapse;
    }
    .wx-content th,
    .wx-content td {
      border: 1px solid ${color.border};
      padding: 10px 12px;
      text-align: left;
    }
    .wx-content th {
      background: ${color.light};
      color: ${color.dark};
      font-weight: 600;
    }
    .wx-content img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 24px auto;
      border-radius: 8px;
    }
    .wx-content ul,
    .wx-content ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .wx-content hr {
      border: none;
      border-top: 1px solid ${color.border};
      margin: 32px 0;
    }
    .wx-content .katex { font-size: 1.1em; }
    .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
    .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
    .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
    .wx-content .footnotes li { font-size: 14px; }
    .wx-content .footnotes a { color: ${color.accent}; border-bottom: none; }
    .wx-content .toc a:hover { color: ${color.accent}; }
    ${buildTimelineTokenCSS(color)}
  `
}

// 生成 Elegant 系列 CSS
function generateElegantCSS(color, codeTheme = 'github', isDark = false) {
  const ct = codeThemes[codeTheme]
  const codeStyles = isDark && ct.dark ? ct.dark : ct.light || ct.dark
  return `
    .wx-content {
      font-family: "Noto Serif SC", "PingFang SC", serif;
      color: #374151;
      ${contentWidthRule}
      margin: 0 auto;
      line-height: 1.9;
    }
    .wx-content h1 {
      font-size: 30px;
      margin: 0 0 28px;
      color: ${color.dark};
      font-weight: 700;
      padding-bottom: 16px;
      border-bottom: 2px solid ${color.accent};
    }
    .wx-content h2 {
      font-size: 22px;
      margin: 36px 0 16px;
      color: ${color.accent};
      font-weight: 600;
      padding: 10px 16px;
      background: linear-gradient(90deg, ${color.light} 0%, transparent 100%);
      border-radius: 0 8px 8px 0;
    }
    .wx-content h3 {
      font-size: 18px;
      margin: 28px 0 12px;
      color: ${color.dark};
      font-weight: 600;
      padding-left: 12px;
      border-left: 3px solid ${color.border};
    }
    .wx-content p,
    .wx-content li {
      font-size: 16px;
    }
    .wx-content p {
      margin: 16px 0;
    }
    .wx-content blockquote {
      margin: 24px 0;
      padding: 18px 24px;
      background: linear-gradient(135deg, ${color.light} 0%, #ffffff 100%);
      border-left: 4px solid ${color.accent};
      border-radius: 0 16px 16px 0;
      font-style: italic;
    }
    .wx-content code {
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 0.9em;
      color: ${color.accent};
      background: ${color.light};
      border-radius: 4px;
      padding: 2px 6px;
    }
    .wx-content pre {
      margin: 20px 0;
      padding: 18px;
      border-radius: 12px;
      overflow-x: auto;
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    .wx-content pre code {
      color: inherit;
      background: transparent;
      padding: 0;
      font-size: inherit;
    }
    ${codeStyles}
    .wx-content a {
      color: ${color.accent};
      text-decoration: none;
      border-bottom: 1px dashed ${color.border};
    }
    .wx-content a:hover {
      border-bottom-style: solid;
    }
    .wx-content mark {
      background: linear-gradient(120deg, ${color.light} 0%, ${color.border} 100%);
      color: ${color.dark};
      padding: 0 4px;
      border-radius: 2px;
    }
    .wx-content table {
      width: 100%;
      margin: 24px 0;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .wx-content th,
    .wx-content td {
      border: 1px solid ${color.border};
      padding: 10px 12px;
      text-align: left;
    }
    .wx-content th {
      background: linear-gradient(135deg, ${color.light} 0%, #ffffff 100%);
      color: ${color.dark};
      font-weight: 600;
    }
    .wx-content img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 24px auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .wx-content ul,
    .wx-content ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .wx-content hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, ${color.border} 50%, transparent 100%);
      margin: 36px 0;
    }
    .wx-content .katex { font-size: 1.1em; }
    .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
    .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
    .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
    .wx-content .footnotes li { font-size: 14px; }
    .wx-content .footnotes a { color: ${color.accent}; border-bottom: none; }
    .wx-content .toc { background: linear-gradient(135deg, ${color.light} 0%, #ffffff 100%); border: 1px solid ${color.border}; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
    .wx-content .toc h4 { margin: 0 0 12px; color: ${color.dark}; font-size: 14px; }
    .wx-content .toc a:hover { color: ${color.accent}; }
    ${buildTimelineTokenCSS(color)}
  `
}

// 生成 Bold 系列 CSS
function generateBoldCSS(color, codeTheme = 'github', isDark = false) {
  const ct = codeThemes[codeTheme]
  const codeStyles = isDark && ct.dark ? ct.dark : ct.light || ct.dark
  return `
    .wx-content {
      font-family: "PingFang SC", "Helvetica Neue", sans-serif;
      color: #1f2937;
      ${contentWidthRule}
      margin: 0 auto;
      line-height: 1.8;
    }
    .wx-content h1 {
      font-size: 32px;
      margin: 0 0 24px;
      color: #ffffff;
      font-weight: 700;
      padding: 20px 24px;
      background: ${color.accent};
      border-radius: 12px;
      box-shadow: 0 4px 12px ${color.border}80;
    }
    .wx-content h2 {
      font-size: 22px;
      margin: 32px 0 16px;
      color: #ffffff;
      font-weight: 600;
      padding: 14px 20px;
      background: ${color.dark};
      border-radius: 8px;
    }
    .wx-content h3 {
      font-size: 18px;
      margin: 28px 0 12px;
      color: ${color.accent};
      font-weight: 600;
      padding: 8px 0;
      border-bottom: 3px solid ${color.accent};
      display: inline-block;
    }
    .wx-content p,
    .wx-content li {
      font-size: 16px;
    }
    .wx-content p {
      margin: 16px 0;
    }
    .wx-content blockquote {
      margin: 24px 0;
      padding: 20px 24px;
      background: ${color.light};
      border-radius: 12px;
      border: 2px solid ${color.border};
    }
    .wx-content code {
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 0.9em;
      color: ${color.accent};
      background: ${color.light};
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 500;
    }
    .wx-content pre {
      margin: 20px 0;
      padding: 18px;
      border-radius: 12px;
      overflow-x: auto;
      font-family: "SF Mono", "JetBrains Mono", monospace;
      font-size: 14px;
      line-height: 1.6;
      border: 2px solid ${color.border};
    }
    .wx-content pre code {
      color: inherit;
      background: transparent;
      padding: 0;
      font-size: inherit;
    }
    ${codeStyles}
    .wx-content a {
      color: ${color.accent};
      text-decoration: none;
      font-weight: 500;
      border-bottom: 2px solid ${color.border};
    }
    .wx-content mark {
      background: ${color.accent};
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }
    .wx-content table {
      width: 100%;
      margin: 24px 0;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .wx-content th,
    .wx-content td {
      border: 1px solid ${color.border};
      padding: 12px 14px;
      text-align: left;
    }
    .wx-content th {
      background: ${color.accent};
      color: #ffffff;
      font-weight: 600;
    }
    .wx-content tr:nth-child(even) {
      background: ${color.light};
    }
    .wx-content img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 24px auto;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .wx-content ul,
    .wx-content ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .wx-content hr {
      border: none;
      height: 3px;
      background: ${color.accent};
      border-radius: 2px;
      margin: 32px 0;
    }
    .wx-content .katex { font-size: 1.1em; }
    .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
    .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
    .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
    .wx-content .footnotes li { font-size: 14px; }
    .wx-content .footnotes a { color: ${color.accent}; border-bottom: none; }
    .wx-content .toc { background: ${color.light}; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 2px solid ${color.border}; }
    .wx-content .toc h4 { margin: 0 0 12px; color: ${color.dark}; font-size: 14px; }
    .wx-content .toc a:hover { color: ${color.accent}; }
    ${buildTimelineTokenCSS(color)}
  `
}

// 生成 Classic 系列 CSS（原有主题）
function generateClassicCSS(theme, codeTheme = 'github', isDark = false) {
  const ct = codeThemes[codeTheme]
  const codeStyles = isDark && ct.dark ? ct.dark : ct.light || ct.dark
  
  if (theme === 'journal') {
    return `
      .wx-content {
        font-family: "PingFang SC", "Noto Serif SC", "Source Han Serif SC", serif;
        color: #2d241d;
        ${contentWidthRule}
        margin: 0 auto;
        line-height: 1.9;
      }
      .wx-content h1, .wx-content h2, .wx-content h3 {
        color: #1f1711;
        line-height: 1.35;
        letter-spacing: 0.02em;
      }
      .wx-content h1 {
        font-size: 30px;
        margin: 0 0 28px;
        padding-bottom: 18px;
        border-bottom: 3px solid #f5c6a5;
      }
      .wx-content h2 {
        font-size: 23px;
        margin: 32px 0 16px;
      }
      .wx-content h3 {
        font-size: 18px;
        margin: 28px 0 12px;
      }
      .wx-content p, .wx-content li { font-size: 16px; }
      .wx-content p { margin: 14px 0; }
      .wx-content blockquote {
        margin: 24px 0;
        padding: 16px 20px;
        background: #fff7f2;
        border-left: 4px solid #c2410c;
      }
      .wx-content code {
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 0.9em;
        color: #9a3412;
        background: #fff1e8;
        border-radius: 4px;
        padding: 2px 6px;
      }
      .wx-content pre {
        margin: 22px 0;
        padding: 18px;
        border-radius: 14px;
        overflow-x: auto;
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 14px;
        line-height: 1.6;
      }
      .wx-content pre code {
        color: inherit;
        background: transparent;
        padding: 0;
        font-size: inherit;
      }
      ${codeStyles}
      .wx-content a {
        color: #c2410c;
        text-decoration: none;
        border-bottom: 1px solid #c2410c;
      }
      .wx-content mark {
        background: #fde68a;
        color: inherit;
        padding: 0 4px;
      }
      .wx-content table {
        width: 100%;
        margin: 24px 0;
        border-collapse: collapse;
        background: #fffdfb;
      }
      .wx-content th, .wx-content td {
        border: 1px solid #e7d5c7;
        padding: 10px 12px;
        text-align: left;
      }
      .wx-content th { background: #fff1e8; }
      .wx-content img {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 24px auto;
        border-radius: 14px;
      }
      .wx-content ul, .wx-content ol {
        margin: 16px 0;
        padding-left: 24px;
      }
      .wx-content hr {
        border: none;
        border-top: 1px solid #e7d5c7;
        margin: 28px 0;
      }
      .wx-content .katex { font-size: 1.1em; }
      .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
      .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
      .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
      .wx-content .footnotes li { font-size: 14px; }
      .wx-content .footnotes a { color: #c2410c; border-bottom: none; }
      .wx-content .toc a:hover { color: #c2410c; }
      ${buildTimelineTokenCSS({
        accent: '#c2410c',
        light: '#fff7f2',
        dark: '#9a3412',
        border: '#f5c6a5',
      })}
    `
  }
  
  if (theme === 'slate') {
    return `
      .wx-content {
        font-family: "IBM Plex Sans", "PingFang SC", sans-serif;
        color: #102a43;
        ${contentWidthRule}
        margin: 0 auto;
        line-height: 1.85;
      }
      .wx-content h1 {
        font-size: 32px;
        margin: 0 0 24px;
        color: #081f33;
      }
      .wx-content h2 {
        font-size: 22px;
        margin: 34px 0 14px;
        color: #0f766e;
        padding-left: 14px;
        border-left: 4px solid #14b8a6;
      }
      .wx-content h3 {
        font-size: 18px;
        margin: 28px 0 12px;
        color: #155e75;
      }
      .wx-content p, .wx-content li { font-size: 16px; }
      .wx-content p { margin: 14px 0; }
      .wx-content blockquote {
        margin: 24px 0;
        padding: 18px 20px;
        background: linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%);
        border: 1px solid #99f6e4;
        border-radius: 16px;
      }
      .wx-content code {
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 0.9em;
        color: #0f766e;
        background: #e6fffb;
        border-radius: 4px;
        padding: 2px 6px;
      }
      .wx-content pre {
        margin: 22px 0;
        padding: 18px;
        border-radius: 16px;
        overflow-x: auto;
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 14px;
        line-height: 1.6;
      }
      .wx-content pre code {
        color: inherit;
        background: transparent;
        padding: 0;
        font-size: inherit;
      }
      ${codeStyles}
      .wx-content a {
        color: #0f766e;
        text-decoration: none;
        box-shadow: inset 0 -1px 0 #5eead4;
      }
      .wx-content mark {
        background: #99f6e4;
        color: #134e4a;
        padding: 0 4px;
      }
      .wx-content table {
        width: 100%;
        margin: 24px 0;
        border-collapse: collapse;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
      }
      .wx-content th, .wx-content td {
        border: 1px solid #d6f4f1;
        padding: 10px 12px;
        text-align: left;
      }
      .wx-content th { background: #ecfeff; }
      .wx-content img {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 24px auto;
        border-radius: 16px;
      }
      .wx-content ul, .wx-content ol {
        margin: 16px 0;
        padding-left: 24px;
      }
      .wx-content hr {
        border: none;
        border-top: 1px solid #c9eeea;
        margin: 28px 0;
      }
      .wx-content .katex { font-size: 1.1em; }
      .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
      .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
      .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
      .wx-content .footnotes li { font-size: 14px; }
      .wx-content .footnotes a { color: #0f766e; border-bottom: none; box-shadow: none; }
      .wx-content .toc a:hover { color: #0f766e; }
      ${buildTimelineTokenCSS({
        accent: '#0f766e',
        light: '#ecfeff',
        dark: '#155e75',
        border: '#99f6e4',
      })}
    `
  }
  
  if (theme === 'paper') {
    return `
      .wx-content {
        font-family: "PingFang SC", "Helvetica Neue", sans-serif;
        color: #1f2937;
        ${contentWidthRule}
        margin: 0 auto;
        line-height: 1.8;
      }
      .wx-content h1 {
        font-size: 28px;
        margin: 0 0 22px;
        color: #111827;
      }
      .wx-content h2 {
        font-size: 21px;
        margin: 32px 0 14px;
        color: #1d4ed8;
      }
      .wx-content h3 {
        font-size: 17px;
        margin: 26px 0 12px;
        color: #374151;
      }
      .wx-content p, .wx-content li { font-size: 16px; }
      .wx-content p { margin: 12px 0; }
      .wx-content blockquote {
        margin: 22px 0;
        padding: 14px 18px;
        border-left: 4px solid #1d4ed8;
        background: #eff6ff;
      }
      .wx-content code {
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 0.9em;
        color: #1d4ed8;
        background: #eff6ff;
        border-radius: 4px;
        padding: 2px 6px;
      }
      .wx-content pre {
        margin: 22px 0;
        padding: 18px;
        border-radius: 12px;
        overflow-x: auto;
        font-family: "SF Mono", "JetBrains Mono", monospace;
        font-size: 14px;
        line-height: 1.6;
      }
      .wx-content pre code {
        color: inherit;
        background: transparent;
        padding: 0;
        font-size: inherit;
      }
      ${codeStyles}
      .wx-content a {
        color: #1d4ed8;
        text-decoration: none;
      }
      .wx-content mark {
        background: #bfdbfe;
        color: #1e3a8a;
        padding: 0 4px;
      }
      .wx-content table {
        width: 100%;
        margin: 24px 0;
        border-collapse: collapse;
      }
      .wx-content th, .wx-content td {
        border: 1px solid #dbeafe;
        padding: 10px 12px;
        text-align: left;
      }
      .wx-content th { background: #eff6ff; }
      .wx-content img {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 22px auto;
        border-radius: 12px;
      }
      .wx-content ul, .wx-content ol {
        margin: 16px 0;
        padding-left: 24px;
      }
      .wx-content hr {
        border: none;
        border-top: 1px solid #dbeafe;
        margin: 28px 0;
      }
      .wx-content .katex { font-size: 1.1em; }
      .wx-content .katex-display { margin: 24px 0; overflow-x: auto; overflow-y: hidden; }
      .wx-content .mermaid-chart { text-align: center; margin: 24px 0; }
      .wx-content .mermaid-chart svg { max-width: 100%; height: auto; }
      .wx-content .footnotes li { font-size: 14px; }
      .wx-content .footnotes a { color: #1d4ed8; }
      .wx-content .toc a:hover { color: #1d4ed8; }
      ${buildTimelineTokenCSS({
        accent: '#1d4ed8',
        light: '#eff6ff',
        dark: '#1e40af',
        border: '#dbeafe',
      })}
    `
  }
}

// 构建主题对象
export const themes = {}

// Classic 系列
for (const [key, config] of Object.entries(classicThemes)) {
  themes[key] = {
    label: config.label,
    accent: config.accent,
    css: (codeTheme, isDark) => generateClassicCSS(key, codeTheme, isDark),
  }
}

// Minimal 系列
for (const [key, config] of Object.entries(minimalThemes)) {
  themes[key] = {
    label: config.label,
    accent: config.accent,
    css: (codeTheme, isDark) => generateMinimalCSS(config, codeTheme, isDark),
  }
}

// Focus 系列
for (const [key, config] of Object.entries(focusThemes)) {
  themes[key] = {
    label: config.label,
    accent: config.accent,
    css: (codeTheme, isDark) => generateFocusCSS(config, codeTheme, isDark),
  }
}

// Elegant 系列
for (const [key, config] of Object.entries(elegantThemes)) {
  themes[key] = {
    label: config.label,
    accent: config.accent,
    css: (codeTheme, isDark) => generateElegantCSS(config, codeTheme, isDark),
  }
}

// Bold 系列
for (const [key, config] of Object.entries(boldThemes)) {
  themes[key] = {
    label: config.label,
    accent: config.accent,
    css: (codeTheme, isDark) => generateBoldCSS(config, codeTheme, isDark),
  }
}

// 主题分组（用于 UI 展示）
export const themeGroups = {
  classic: {
    label: 'Classic 经典',
    themes: Object.keys(classicThemes),
  },
  minimal: {
    label: 'Minimal 极简',
    themes: Object.keys(minimalThemes),
  },
  focus: {
    label: 'Focus 居中',
    themes: Object.keys(focusThemes),
  },
  elegant: {
    label: 'Elegant 优雅',
    themes: Object.keys(elegantThemes),
  },
  bold: {
    label: 'Bold  bold',
    themes: Object.keys(boldThemes),
  },
}

function resolveContentMaxWidth(layoutOptions = {}) {
  if (Number.isFinite(layoutOptions.contentMaxWidth) && layoutOptions.contentMaxWidth > 0) {
    return `${layoutOptions.contentMaxWidth}px`
  }

  return 'none'
}

function resolveDocumentTitle(layoutOptions = {}) {
  const title = typeof layoutOptions.documentTitle === 'string' ? layoutOptions.documentTitle.trim() : ''
  return title || '微信公众号排版'
}

function escapeHtmlText(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolvePdfFontFamily(layoutOptions = {}) {
  const fontFamily = typeof layoutOptions.pdfFontFamily === 'string' ? layoutOptions.pdfFontFamily.trim() : ''
  return fontFamily || '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif'
}

function buildPdfExportCSS(layoutOptions = {}) {
  const fontFamily = resolvePdfFontFamily(layoutOptions)

  return `
      .wx-content {
        font-family: ${fontFamily};
      }
      .wx-content pre,
      .wx-content code {
        font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
      }
      @media print {
        html,
        body {
          background: #ffffff;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .wx-content {
          width: 100%;
        }
        .wx-content h1,
        .wx-content h2,
        .wx-content h3,
        .wx-content h4,
        .wx-content h5,
        .wx-content h6 {
          break-after: avoid-page;
          page-break-after: avoid;
        }
        .wx-content p,
        .wx-content li {
          orphans: 3;
          widows: 3;
        }
        .wx-content blockquote,
        .wx-content figure,
        .wx-content img,
        .wx-content pre,
        .wx-content table,
        .wx-content .katex-display,
        .wx-content .mermaid-chart,
        .wx-content .toc {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .wx-content pre {
          white-space: pre-wrap;
          overflow: visible;
        }
        .wx-content table {
          break-inside: auto;
        }
        .wx-content tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `
}

export function buildHtmlDocument(content, themeKey, codeTheme = 'github', isDark = false, layoutOptions = {}) {
  const theme = themes[themeKey]
  const contentMaxWidth = resolveContentMaxWidth(layoutOptions)
  const documentTitle = escapeHtmlText(resolveDocumentTitle(layoutOptions))
  const isPdfExport = layoutOptions.outputMode === 'pdf'
  const bodyPadding = isPdfExport ? '0' : '28px 20px'
  const pdfExportCSS = isPdfExport ? buildPdfExportCSS(layoutOptions) : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${documentTitle}</title>
    <style>
      ${katexCss}
      body {
        margin: 0;
        padding: ${bodyPadding};
        background: #ffffff;
        --fh-content-max-width: ${contentMaxWidth};
      }
      ${theme.css(codeTheme, isDark)}
      ${pdfExportCSS}
    </style>
  </head>
  <body>
    <div class="wx-content">
      ${content}
    </div>
  </body>
</html>`
}
