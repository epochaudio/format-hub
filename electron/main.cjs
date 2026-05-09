const { app, BrowserWindow, clipboard, dialog, ipcMain } = require('electron')
const fs = require('fs/promises')
const path = require('path')

const CLIPBOARD_CHANNEL = 'clipboard:write-rich-text'
const PDF_EXPORT_CHANNEL = 'pdf:export'
const DEFAULT_PDF_PAGE_SIZE = 'A4'
const PDF_ALLOWED_PAGE_SIZES = new Set(['A4', 'Letter'])
const DEFAULT_PDF_MARGIN_MM = {
  top: 18,
  right: 16,
  bottom: 18,
  left: 16,
}
const PDF_MARGIN_MIN_MM = 0
const PDF_MARGIN_MAX_MM = 50
const MILLIMETERS_PER_INCH = 25.4
const PDF_TITLE_MAX_LENGTH = 120
const PDF_TEMPLATE_MAX_LENGTH = 240
const PRINT_ASSET_WAIT_TIMEOUT_MS = 8000

function normalizeClipboardPayload(payload) {
  const html = typeof payload?.html === 'string' ? payload.html : ''
  const text = typeof payload?.text === 'string' ? payload.text : ''

  if (!html.trim()) {
    throw new Error('复制内容不能为空')
  }

  return { html, text }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeBoundedText(value, fallback, maxLength) {
  const text = typeof value === 'string' ? value.trim() : ''
  const normalized = text || fallback

  return normalized.slice(0, maxLength)
}

function normalizeMarginMm(value, fallback) {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback

  return clampNumber(parsed, PDF_MARGIN_MIN_MM, PDF_MARGIN_MAX_MM)
}

function normalizePdfMargins(value) {
  return {
    top: normalizeMarginMm(value?.top, DEFAULT_PDF_MARGIN_MM.top),
    right: normalizeMarginMm(value?.right, DEFAULT_PDF_MARGIN_MM.right),
    bottom: normalizeMarginMm(value?.bottom, DEFAULT_PDF_MARGIN_MM.bottom),
    left: normalizeMarginMm(value?.left, DEFAULT_PDF_MARGIN_MM.left),
  }
}

function millimetersToInches(value) {
  return value / MILLIMETERS_PER_INCH
}

function normalizePdfPayload(payload) {
  const html = typeof payload?.html === 'string' ? payload.html : ''
  if (!html.trim()) {
    throw new Error('PDF 导出内容不能为空')
  }

  const options = payload?.options && typeof payload.options === 'object' ? payload.options : {}
  const pageSize = PDF_ALLOWED_PAGE_SIZES.has(options.pageSize)
    ? options.pageSize
    : DEFAULT_PDF_PAGE_SIZE

  return {
    html,
    options: {
      title: normalizeBoundedText(options.title, 'wechat-article', PDF_TITLE_MAX_LENGTH),
      pageSize,
      marginsMm: normalizePdfMargins(options.marginsMm),
      headerTemplate: normalizeBoundedText(options.headerTemplate, '', PDF_TEMPLATE_MAX_LENGTH),
      footerTemplate: normalizeBoundedText(options.footerTemplate, '', PDF_TEMPLATE_MAX_LENGTH),
    },
  }
}

function replacePrintTemplateTokens(value) {
  return escapeHtml(value)
    .replace(/\{date\}/g, '<span class="date"></span>')
    .replace(/\{title\}/g, '<span class="title"></span>')
    .replace(/\{url\}/g, '<span class="url"></span>')
    .replace(/\{pageNumber\}/g, '<span class="pageNumber"></span>')
    .replace(/\{totalPages\}/g, '<span class="totalPages"></span>')
}

function buildPrintTemplate(value, alignment) {
  if (!value) return '<div></div>'

  return `
    <div style="box-sizing:border-box;width:100%;padding:0 24px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif;font-size:8px;text-align:${alignment};">
      ${replacePrintTemplateTokens(value)}
    </div>
  `
}

function buildPrintToPdfOptions(options) {
  const displayHeaderFooter = Boolean(options.headerTemplate || options.footerTemplate)
  const margins = options.marginsMm

  return {
    pageSize: options.pageSize,
    printBackground: true,
    displayHeaderFooter,
    headerTemplate: buildPrintTemplate(options.headerTemplate, 'left'),
    footerTemplate: buildPrintTemplate(options.footerTemplate, 'right'),
    margins: {
      marginType: 'custom',
      top: millimetersToInches(margins.top),
      right: millimetersToInches(margins.right),
      bottom: millimetersToInches(margins.bottom),
      left: millimetersToInches(margins.left),
    },
    preferCSSPageSize: false,
  }
}

function buildSafePdfFilename(title) {
  const filename = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PDF_TITLE_MAX_LENGTH)

  return filename || 'wechat-article'
}

function ensurePdfExtension(filePath) {
  return path.extname(filePath).toLowerCase() === '.pdf' ? filePath : `${filePath}.pdf`
}

async function waitForPrintableContent(window) {
  await window.webContents.executeJavaScript(`
    (async () => {
      const waitForAssets = (async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }

        const images = Array.from(document.images || [])
        await Promise.all(images.map((image) => {
          if (image.complete) return Promise.resolve()

          return new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
          })
        }))
      })()

      const timeout = new Promise((resolve) => {
        window.setTimeout(resolve, ${PRINT_ASSET_WAIT_TIMEOUT_MS})
      })

      await Promise.race([waitForAssets, timeout])

      return true
    })()
  `)
}

async function createPdfBuffer(html, options) {
  const tempDirectory = await fs.mkdtemp(path.join(app.getPath('temp'), 'format-hub-pdf-'))
  const htmlPath = path.join(tempDirectory, 'document.html')
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  try {
    await fs.writeFile(htmlPath, html, 'utf8')
    await pdfWindow.loadFile(htmlPath)
    await waitForPrintableContent(pdfWindow)

    return await pdfWindow.webContents.printToPDF(buildPrintToPdfOptions(options))
  } finally {
    if (!pdfWindow.isDestroyed()) {
      pdfWindow.destroy()
    }

    await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => {})
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  ipcMain.handle(CLIPBOARD_CHANNEL, (_event, payload) => {
    const normalizedPayload = normalizeClipboardPayload(payload)
    clipboard.write({
      html: normalizedPayload.html,
      text: normalizedPayload.text,
    })
    return { ok: true }
  })

  ipcMain.handle(PDF_EXPORT_CHANNEL, async (event, payload) => {
    const normalizedPayload = normalizePdfPayload(payload)
    const parentWindow = BrowserWindow.fromWebContents(event.sender)
    const defaultPath = path.join(
      app.getPath('downloads'),
      `${buildSafePdfFilename(normalizedPayload.options.title)}.pdf`
    )
    const saveResult = await dialog.showSaveDialog(parentWindow, {
      title: '导出 PDF',
      defaultPath,
      filters: [{ name: 'PDF 文档', extensions: ['pdf'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { ok: false, canceled: true }
    }

    const filePath = ensurePdfExtension(saveResult.filePath)
    const pdfBuffer = await createPdfBuffer(normalizedPayload.html, normalizedPayload.options)
    await fs.writeFile(filePath, pdfBuffer)

    return { ok: true, filePath }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
