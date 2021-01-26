const { BrowserWindow } = require("electron");

class MainWindow extends BrowserWindow {
  constructor(filePath, isDevelopmentMode) {
    super({
      title: "CPU Monitor",
      width: isDevelopmentMode ? 900 : 500,
      height: 600,
      icon: "./assets/icons/icon.png",
      resizable: isDevelopmentMode ? true : false,
      show: false,
      opacity: 0.83,
      webPreferences: {
        nodeIntegration: true,
      },
    });
    this.loadFile(filePath);
    // start dev tools automatically in dev mode
    if (isDevelopmentMode) {
      this.webContents.openDevTools();
    }
  }
}

module.exports = MainWindow;
