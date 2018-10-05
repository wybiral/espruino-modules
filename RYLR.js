let at = null;

function atcmd(cmd, timeout) {
  return new Promise((resolve, reject) => {
    let data = '';
    function callback(d) {
      if (d === undefined) {
        reject(cmd + ': TIMEOUT');
      } else if (d == '+OK') {
        resolve(data);
      } else if (d.slice(0, 4) == '+ERR') {
        reject(cmd + ': ' + d.slice(1));
      } else {
        data += (data ? '\n' : '') + d;
        return callback;
      }
    }
    at.cmd(cmd + '\r\n', timeout || 1000, callback);
  });
}

function receive(line) {
  // Skip "+RCV="
  line = line.slice(5);
  // Parse address
  let idx = line.indexOf(',');
  const addr = parseInt(line.slice(0, idx));
  line = line.slice(idx + 1);
  // Parse length
  idx = line.indexOf(',');
  const len = parseInt(line.slice(0, idx));
  line = line.slice(idx + 1);
  // Parse data
  const data = line.slice(0, len);
  line = line.slice(len + 1);
  // Parse RSSI
  idx = line.indexOf(',');
  const rssi = parseInt(line.slice(0, idx));
  line = line.slice(idx + 1);
  // Parse SNR
  const snr = parseInt(line);
  // Trigger event
  rylrFuncs.emit('data', {
    addr: addr,
    data: data,
    rssi: rssi,
    snr: snr
  });
}

function setParameter(options) {
  return new Promise((resolve, reject) => {
    options = options || {};
    let params = '';
    params += (options.spreadingFactor || 12) + ',';
    params += (options.bandwidth || 7) + ',';
    params += (options.codingRate || 1) + ',';
    params += (options.preamble || 4);
    return atcmd('AT+PARAMETER=' + params);
  });
}

function setBand(band) {
  return new Promise((resolve, reject) => {
    return atcmd('AT+BAND=' + band);
  });
}

function setAddress(address) {
  return new Promise((resolve, reject) => {
    return atcmd('AT+ADDRESS=' + address);
  });
}

function setNetworkID(networkID) {
  return new Promise((resolve, reject) => {
    return atcmd('AT+NETWORKID=' + networkID);
  });
}

function send(data, addr) {
  const len = data.length;
  if (addr === undefined) {
    addr = 0;
  }
  at.write('AT+SEND=' + addr + ',' + len + ',' + data + '\r\n');
}

const rylrFuncs = {
  'setParameter': setParameter,
  'setBand': setBand,
  'setAddress': setAddress,
  'setNetworkID': setNetworkID,
  'send': send,
};

exports.connect = function(usart, options, callback) {
  at = require('AT').connect(usart);
  at.registerLine('+RCV', receive);
  return rylrFuncs;
};
