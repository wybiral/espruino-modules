let at = null;

function atcmd(cmd, timeout) {
  return new Promise((resolve, reject) => {
    let data = '';
    at.cmd(cmd + '\r\n', timeout || 1000, function cb(d) {
      if (d === undefined || d == 'ERROR') {
        reject(cmd + ': ' + (d ? d : 'TIMEOUT'));
      } else if (d == '+OK') {
        print('cool');
        resolve(data);
      } else {
        data += (data ? '\n' : '') + d;
        return cb;
      }
    });
  });
}

const rylrFuncs = {
  'send': (data, addr) => {
    const len = data.length;
    if (addr === undefined) {
      addr = 0;
    }
    at.write('AT+SEND=' + addr + ',' + len + ',' + data + '\r\n');
  },
};

exports.connect = function(usart, options, callback) {
  at = require('AT').connect(usart);

  at.registerLine('+RCV', line => {
    // Skip +RCV= part
    line = line.slice(5);
    // Grab address
    let idx = line.indexOf(',');
    const addr = parseInt(line.slice(0, idx));
    line = line.slice(idx + 1);
    // Grab length
    idx = line.indexOf(',');
    const len = parseInt(line.slice(0, idx));
    line = line.slice(idx + 1);
    // Grab data
    const data = line.slice(0, len);
    line = line.slice(len + 1);
    // Parse RSSI
    idx = line.indexOf(',');
    const rssi = parseInt(line.slice(0, idx));
    line = line.slice(idx + 1);
    // Parse SNR
    idx = line.indexOf(',');
    const snr = parseInt(line.slice(0, idx));
    line = line.slice(idx + 1);
    rylrFuncs.emit('data', {
      addr: addr,
      data: data,
      rssi: rssi,
      snr: snr
    });
  });

  return rylrFuncs;
};
