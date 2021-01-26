const path = require("path");
const { app, Menu, ipcMain, Tray } = require("electron");
const log = require("electron-log");
const Store = require("./Store");
const MainWindow = require("./MainWindow");

// Set env
process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV === "development" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow = null;
let tray = null;

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
  mainWindow = new MainWindow("./app/index.html", isDev);
}

function instantiateMainWindow() {
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
}

app.on("ready", () => {
  instantiateMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on("close", (e) => {
    // ideally prevent the situtation the
    // exception handles below
    if (!app.isQuitting) {
      e.preventDefault();
      // window is hidden unless quit explicitly
      mainWindow.hide();
    }
    return true;
  });

  // instantiate the tray
  const icon = path.join(__dirname, "assets", "icons", "tray_icon.png");
  tray = new Tray(icon);
  tray.setToolTip("Electron SysTop Monitor");

  tray.on("click", () => {
    // check if the main window is visible
    try {
      // main window instance is destroyed when the window is
      // closed on OSX; if it throws reinstantiate the window
      if (mainWindow.isVisible() == true) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } catch (error) {
      log.error(error);
      instantiateMainWindow();
      // default is hidden. window reinstantiated but will not show
      // avoids differing behavior
      mainWindow.show();
    }
  });

  // add an option to quit the application
  tray.on("right-click", () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Quit",
        click: () => {
          (app.isQuitting = true), app.quit();
        },
      },
    ]);

    tray.popUpContextMenu(contextMenu);
  });
});

const menu = [
  ...(isMac ? [{ role: "appMenu" }] : []),
  {
    role: "fileMenu",
  },
  {
    label: "View",
    submenu: [
      {
        label: "Toggle Navigation",
        click: () => mainWindow.webContents.send("nav:toggle"),
      },
    ],
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
  if (mainWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.allowRendererProcessReuse = true;
