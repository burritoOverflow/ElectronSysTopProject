const os = require("os");
const path = require("path");

const osu = require("node-os-utils");
const { ipcRenderer } = require("electron");

const cpuData = os.cpus();
const arch = os.arch();
const osType = os.type();

const cpuModel = cpuData[0].model;
const hostname = os.hostname();

const settingsForm = document.getElementById("settings-form");

// track these globally as the interval requires them
let cpuThreshold, alertFrequency;

// event sent from the main window event
ipcRenderer.on("settings:get", (e, settings) => {
  // set the UI to the values from the settings file
  document.getElementById("cpu-overload").value = settings.cpuThreshold;
  document.getElementById("alert-frequency").value = settings.alertFrequency;

  // set the global state to reflect the change
  cpuThreshold = settings.cpuThreshold;
  alertFrequency = settings.alertFrequency;
});

// get submitted settings from the UI
settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const cpuThreshold = document.getElementById("cpu-overload").value;
  const alertFrequency = document.getElementById("alert-frequency").value;

  // send new settings to main process
  ipcRenderer.send("settings:set", {
    settings: {
      cpuThreshold: parseFloat(cpuThreshold),
      alertFrequency: parseFloat(alertFrequency),
    },
  });

  showAlert("Settings saved.");
});

function showNotification(options) {
  new Notification(options.title, options);
}

// show alert for 3 seconds
function showAlert(message) {
  const alert = document.getElementById("alert");
  alert.classList.remove("hide");
  alert.classList.add("alert");
  alert.innerText = message;
  setTimeout(() => {
    alert.classList.add("hide");
  }, 3000);
}

// convert the uptime to a more human readable format
function getUptimeDHMS() {
  const uptimeTotalSec = os.uptime();
  const days = Math.floor(uptimeTotalSec / (3600 * 24));
  const hours = Math.floor((uptimeTotalSec % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeTotalSec % 3600) / 60);
  const seconds = Math.floor(uptimeTotalSec % 60);
  return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
}

// check the elapsed time since notification
function runNotify(frequency) {
  if (localStorage.getItem("lastNotify") === null) {
    // store the timestamp
    localStorage.setItem("lastNotify", Number(new Date()));
    return true;
  }

  const notifyTime = new Date(parseInt(localStorage.getItem("lastNotify")));
  const timeNow = new Date();
  const timeDelta = Math.abs(timeNow - notifyTime);
  const minutesPassed = Math.ceil(timeDelta / (1000 * 60));
  if (minutesPassed > frequency) {
    return true;
  } else {
    return false;
  }
}

// we'll adjust the cpu use every two seconds
setInterval(() => {
  // update cpu usage
  osu.cpu.usage().then((info) => {
    document.getElementById("cpu-usage").innerText = `${info}%`;

    // update cpu progress bar
    document.getElementById("cpu-progress").style.width = `${info}%`;

    // if use threshold triggered, change bar color to red
    if (info >= cpuThreshold && runNotify(alertFrequency)) {
      document.getElementById("cpu-progress").style.background = "red";

      // show the notification with the cpu % when triggered
      const currentTimeStr = new Date().toLocaleString();
      showNotification({
        title: "CPU Utilization Threshold Exceeded",
        body: `${info}% over threshold of ${cpuThreshold}% at ${currentTimeStr}`,
        icon: path.join(
          path.resolve(__dirname, ".."),
          "assets",
          "icons",
          "icon.png"
        ),
      });

      localStorage.setItem("lastNotify", Number(new Date()));
    } else {
      document.getElementById("cpu-progress").style.background = "#30c88b";
    }
  });

  osu.cpu.free().then((info) => {
    document.getElementById("cpu-free").innerText = `${info}%`;
  });

  // add the uptime
  document.getElementById("sys-uptime").innerText = `${getUptimeDHMS()}`;

  // update memory usage
  osu.mem.info().then((info) => {
    document.getElementById("mem-usage").innerText = `${info.usedMemMb} MB`;
    document.getElementById("mem-free").innerText = `${info.freeMemMb} MB`;
    document.getElementById(
      "mem-free-percent"
    ).innerText = `${info.freeMemPercentage}%`;
  });
}, 2000);

// set the various attributes on the DOM
document.getElementById("cpu-model").innerText = cpuModel;
document.getElementById("comp-name").innerText = hostname;
document.getElementById("os").innerText = `${osType} ${arch}`;

// get total memory
osu.mem.info().then((info) => {
  document.getElementById("mem-total").innerText = `${info.totalMemMb} MB`;
});

// For the toggle event from the menu
ipcRenderer.on("nav:toggle", () => {
  document.getElementById("nav").classList.toggle("hide");
});
