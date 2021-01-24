const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const log = require("electron-log");
const Store = require("./Store");

// Set env
process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV === "development" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;

// init store
const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      cpuThreshold: 65.0,
      alertFrequency: 2.5,
    },
  },
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "CPU Monitor",
    width: isDev ? 900 : 500,
    height: 600,
    icon: "./assets/icons/icon.png",
    resizable: isDev ? true : false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // start dev tools automatically in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile("./app/index.html");
}

app.on("ready", () => {
  createMainWindow();

  mainWindow.webContents.on("dom-ready", () => {
    // parse the settings file when the dom is ready; send the contents to
    // the renderer process
    mainWindow.webContents.send("settings:get", store.get("settings"));
    log.info(
      `dom-ready, sent settings:get with settings ${JSON.stringify(
        store.get("settings")
      )}`
    );
  });

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
});

const menu = [
  ...(isMac ? [{ role: "appMenu" }] : []),
  {
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

// set the settings when the renderer triggers the event
ipcMain.on("settings:set", (e, settingsObj) => {
  // set and get the contents; send to renderer
  store.set(settingsObj);
  mainWindow.webContents.send("settings:get", store.get("settings"));
  log.info(
    `recieved settings:set with settings ${JSON.stringify(
      settingsObj
    )} store now: ${JSON.stringify(store.get("settings"))}`
  );
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.allowRendererProcessReuse = true;
