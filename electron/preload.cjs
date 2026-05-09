const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('formatHubDesktop', {
  copyRichText(payload) {
    return ipcRenderer.invoke('clipboard:write-rich-text', payload)
  },
  exportPdf(payload) {
    return ipcRenderer.invoke('pdf:export', payload)
  },
})
