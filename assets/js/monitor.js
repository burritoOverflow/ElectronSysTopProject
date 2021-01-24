const os = require("os");
const path = require("path");

const osu = require("node-os-utils");

const cpuData = os.cpus();
const arch = os.arch();
const osType = os.type();

const cpuModel = cpuData[0].model;
const hostname = os.hostname();

// convert the uptime to a more human readable format
function getUptimeDHMS() {
  const uptimeTotalSec = os.uptime();
  const days = Math.floor(uptimeTotalSec / (3600 * 24));
  const hours = Math.floor((uptimeTotalSec % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeTotalSec % 3600) / 60);
  const seconds = Math.floor(uptimeTotalSec % 60);
  return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
}

// we'll adjust the cpu use every two seconds
setInterval(() => {
  // update cpu usage
  osu.cpu.usage().then((info) => {
    document.getElementById("cpu-usage").innerText = `${info}%`;
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
