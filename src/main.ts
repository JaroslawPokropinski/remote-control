import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: Electron.BrowserWindow | null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 400,
    width: 600,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: true,
    },
    show: true,
  });

  // and load the index.html of the app.
  // mainWindow.loadFile(path.join(__dirname, "../index.html"));
  mainWindow.loadURL('http://localhost:1234');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// let windows: string[] = [];
let winObservers = new Map<number, Electron.IpcMainEvent>();
ipcMain.on('set-windows', (_event, arg) => {
  winObservers.forEach((v) => {
    v.reply('windows-reply', arg);
  })
});
ipcMain.on('subscribe-windows', (event, _arg) => {
  winObservers.set(event.sender.id, event);
  event.returnValue = 'pong'
});
ipcMain.on('unsubscribe-windows', (event, _arg) => {
  winObservers.delete(event.sender.id);
});

let peerId: string | null = null;
let peerObservers = new Map<number, Electron.IpcMainEvent>();
ipcMain.on('set-peer', (_event, arg: string) => {
  peerId = arg;
  peerObservers.forEach((o) => {
    o.reply('peer-reply', arg);
  });
});
ipcMain.on('subscribe-peer', (event, _arg) => {
  event.returnValue = peerId;
  peerObservers.set(event.sender.id, event);
});
ipcMain.on('unsubscribe-peer', (event, _arg) => {
  peerObservers.delete(event.sender.id);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});