const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  loadLastFolder: () => ipcRenderer.invoke("load-last-folder"),
});
