const { app, BrowserWindow, session } = require("electron");
const path = require("path");

const NIGHTLY_RELOAD_HOUR = 3;
const CRASH_RELOAD_DELAY_MS = 2000;

app.commandLine.appendSwitch("enable-touch-events");
app.commandLine.appendSwitch("touch-events", "enabled");

const gotTheLock = app.requestSingleInstanceLock();
if(!gotTheLock) {
  app.quit();
}

// The website serves ads from the shared index.html; the desktop app never should.
function blockAds() {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["*://pagead2.googlesyndication.com/*"] },
    (_details, callback) => callback({ cancel: true })
  );
}

function reloadAfterCrash(win) {
  win.webContents.on("render-process-gone", (_event, details) => {
    if (details.reason === "clean-exit") return;
    console.error("Renderer gone, reloading:", details.reason);
    // The delay keeps a page that crashes on load from reloading in a tight loop.
    setTimeout(() => {
      if (!win.isDestroyed()) win.reload();
    }, CRASH_RELOAD_DELAY_MS);
  });
}

// Checks the clock every minute rather than setting one long timer, so a device
// that was asleep at 3 AM doesn't reload later in the day while someone is using it.
function scheduleNightlyReload(win) {
  let lastReloadDay = null;
  const timer = setInterval(() => {
    const now = new Date();
    if (now.getHours() !== NIGHTLY_RELOAD_HOUR) return;
    const today = now.toDateString();
    if (lastReloadDay === today) return;
    lastReloadDay = today;
    win.reload();
  }, 60 * 1000);
  win.on("closed", () => clearInterval(timer));
}

function createWindow() {
  const win = new BrowserWindow({
    title: "Splanner",
    fullscreen: true,
    kiosk: true,
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

  reloadAfterCrash(win);
  scheduleNightlyReload(win);

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

app.whenReady().then(() => {
  blockAds();
  createWindow();
});