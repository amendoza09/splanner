const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
  });

  // DEV vs PROD
  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "build", "index.html"));
  }
}


app.whenReady().then(createWindow);