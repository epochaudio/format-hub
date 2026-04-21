const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('formatHubDesktop', {
  copyRichText(payload) {
    return ipcRenderer.invoke('clipboard:write-rich-text', payload)
  },
})
