const { app, Menu, Tray } = require("electron");
const log = require("electron-log");

class AppTray extends Tray {
  constructor(icon, mainWindow) {
    super(icon);

    this.mainWindow = mainWindow;
    this.setToolTip("Electron SysTop Monitor");

    this.on("click", this.onClick.bind(this));

    // add an option to quit the application
    this.on("right-click", this.onRightClick.bind(this));
  }

  onClick() {
    // check if the main window is visible
    try {
      // main window instance is destroyed when the window is
      // closed on OSX; if it throws reinstantiate the window
      if (this.mainWindow.isVisible() == true) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
      }
    } catch (error) {
      log.error(error);
      instantiateMainWindow();
      // default is hidden. window reinstantiated but will not show
      // avoids differing behavior
      this.mainWindow.show();
    }
  }

  onRightClick() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Quit",
        click: () => {
          (app.isQuitting = true), app.quit();
        },
      },
    ]);

    this.popUpContextMenu(contextMenu);
  }
}

module.exports = AppTray;
