const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'format-hub-tests-'))
app.setPath('userData', directory)
const timeout = setTimeout(() => { console.error('浏览器测试超时'); app.exit(1) }, 60000)
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } })
  let exitCode = 1
  try {
    await window.loadURL(new URL('tests/browser.html', process.argv[2]).href)
    const result = await window.webContents.executeJavaScript('window.testResults')
    for (const test of result) console.log(`${test.ok ? 'PASS' : 'FAIL'} ${test.name}${test.error ? `: ${test.error}` : ''}`)
    exitCode = result.length > 0 && result.every(test => test.ok) ? 0 : 1
  } catch (error) { console.error(error) }
  finally {
    clearTimeout(timeout)
    window.destroy()
    fs.rmSync(directory, { recursive: true, force: true })
    app.exit(exitCode)
  }
})
