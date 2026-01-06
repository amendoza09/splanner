const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true
  });

  // DEV vs PROD
  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "build", "index.html"));
  }
}


app.whenReady().then(createWindow);