const { app, BrowserWindow, clipboard, ipcMain } = require('electron')
const path = require('path')

const CLIPBOARD_CHANNEL = 'clipboard:write-rich-text'

function normalizeClipboardPayload(payload) {
  const html = typeof payload?.html === 'string' ? payload.html : ''
  const text = typeof payload?.text === 'string' ? payload.text : ''

  if (!html.trim()) {
    throw new Error('复制内容不能为空')
  }

  return { html, text }
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
