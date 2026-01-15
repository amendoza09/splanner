const { app, BrowserWindow } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("enable-touch-events");
app.commandLine.appendSwitch("touch-events", "enabled");

const gotTheLock = app.requestSingleInstanceLock();
if(!gotTheLock) {
  app.quit();
}

function createWindow() {
  const win = new BrowserWindow({
    title: "Cloud",
    fullscreen: true,
    kiosk: true,               // ✅ real kiosk mode
    frame: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      scrollBounce:true
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "build", "index.html"));
  }

  if (app.isPackaged) {
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });
  }
}

app.whenReady().then(createWindow);