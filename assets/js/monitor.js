const os = require("os");
const path = require("path");

const osu = require("node-os-utils");

const cpuData = os.cpus();
const arch = os.arch();
const osType = os.type();

const cpuSpeed = cpuData[0].speed;
const cpuModel = cpuData[0].model;
const numCpus = cpuData.length;
const hostname = os.hostname();

// we'll adjust the cpu use every two seconds
setInterval(() => {
  // update cpu usage
  osu.cpu.usage().then((info) => {
    document.getElementById("cpu-usage").innerText = `${info}%`;
  });

  osu.cpu.free().then((info) => {
    document.getElementById("cpu-free").innerText = `${info}%`;
  });

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
  // TODO add free and used memory
});
