const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const settingsPath = path.join(app.getPath("userData"), "settings.json");

// Helper functions to save/load the last folder
function saveFolderPath(folder) {
  fs.writeFileSync(settingsPath, JSON.stringify({ lastFolder: folder }));
}

function loadFolderPath() {
  if (!fs.existsSync(settingsPath)) return null;
  try {
    const data = fs.readFileSync(settingsPath);
    return JSON.parse(data).lastFolder || null;
  } catch {
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// Handle folder selection
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) return null;

  const folder = result.filePaths[0];

  // Save the folder path
  saveFolderPath(folder);

  return fs
    .readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(folder, f));
});

// Handle request to load last folder
ipcMain.handle("load-last-folder", () => {
  const folder = loadFolderPath();
  if (!folder || !fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(folder, f));
});

app.whenReady().then(createWindow);
