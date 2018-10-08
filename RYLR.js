/*
  Espruino JS wrapper for REYAX RYLR LoRa modules.
*/
function RYLR(usart) {
  this.at = require('AT').connect(usart);
  this.at.registerLine('+RCV', this._receive);
}

/*
  Wraps at.cmd with Promise and basic response handling.
*/
RYLR.prototype.atcmd = function(cmd, timeout) {
  return new Promise((resolve, reject) => {
    this.at.cmd(cmd + '\r\n', timeout || 5000, data => {
      if (data === undefined) {
        reject(cmd + ': TIMEOUT');
      } else if (data.slice(0, 4) == '+ERR') {
        reject(cmd + ': ' + data.slice(1));
      } else {
        resolve(data);
      }
    });
  });
};

/*
  Handle "+RCV=" events (incoming messages).
*/
RYLR.prototype._receive = function(line) {
  // Skip "+RCV="
  line = line.slice(5);
  // Parse address
  let idx = line.indexOf(',');
  const address = parseInt(line.slice(0, idx));
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
  this.emit('data', {
    address: address,
    data: data,
    rssi: rssi,
    snr: snr
  });
};

/*
  Perform a software reset.
*/
RYLR.prototype.reset = function() {
  return this.atcmd('AT+RESET');
}

/*
  Set sleep mode (0=normal, 1=sleep).
*/
RYLR.prototype.setMode = function(mode) {
  return this.atcmd('AT+MODE=' + mode);
}

/*
  Get sleep mode.
*/
RYLR.prototype.getMode = function() {
  return this.atcmd('AT+MODE?').then(data => {
    return parseInt(data.slice(6));
  });
};

/*
  Set UART baud rate.
*/
RYLR.prototype.setBaudRate = function(baud) {
  return this.atcmd('AT+IPR=' + baud);
}

/*
  Get UART baud rate.
*/
RYLR.prototype.getBaudRate = function() {
  return this.atcmd('AT+IPR?').then(data => {
    return parseInt(data.slice(5));
  });
};

/*
  Set device parameters.

  spreadingFactor is the RF spreading factor.
  Valid range between 7-12 (inclusive).
  Default is 12.

  bandwidth specifies the RF bandwidth and it should be a number between 0-9
  that corresponds to the following table:
    0: 7.8KHz (not recommended, over spec.)
    1: 10.4KHz (not recommended, over spec.)
    2: 15.6KHz
    3: 20.8 KHz
    4: 31.25 KHz
    5: 41.7 KHz
    6: 62.5 KHz
    7: 125 KHz (default)
    8: 250 KHz
    9: 500 KHz

  codingRate is the LoRa forward error correction coding rate.
  Valid range between 1-4 (inclusive).
  Defaults to 1.

  preamble is the LoRa programmed preamble. Valid range between 4-7.
  Defaults to 4.
    */
RYLR.prototype.setParameter = function(options) {
  options = options || {};
  let params = '';
  params += (options.spreadingFactor || 12) + ',';
  params += (options.bandwidth || 7) + ',';
  params += (options.codingRate || 1) + ',';
  params += (options.preamble || 4);
  return this.atcmd('AT+PARAMETER=' + params);
};

/*
  Get device parameters.
*/
RYLR.prototype.getParameter = function() {
  return this.atcmd('AT+PARAMETER?').then(data => {
    data = data.slice(11);
    const parts = data.split(',');
    return {
      spreadingFactor: parseInt(parts[0]),
      bandwidth: parseInt(parts[1]),
      codingRate: parseInt(parts[2]),
      preamble: parseInt(parts[3])
    };
  });
};

/*
  Set RF frequency band (in Hz).
*/
RYLR.prototype.setBand = function(band) {
  return this.atcmd('AT+BAND=' + band);
}

/*
  Get RF frequency band (in Hz).
*/
RYLR.prototype.getBand = function() {
  return this.atcmd('AT+BAND?').then(data => {
    return parseInt(data.slice(6));
  });
};

/*
  Set device address. Valid range between 0-65535 (inclusive).
*/
RYLR.prototype.setAddress = function(address) {
  return this.atcmd('AT+ADDRESS=' + address);
}

/*
  Get device address.
*/
RYLR.prototype.getAddress = function() {
  return this.atcmd('AT+ADDRESS?').then(data => {
    return parseInt(data.slice(9));
  });
};

/*
  Set network ID. Valid range between 0-16 (inclusive).
*/
RYLR.prototype.setNetwork = function(networkID) {
  return this.atcmd('AT+NETWORKID=' + networkID);
}

/*
  Get network ID.
*/
RYLR.prototype.getNetwork = function() {
  return this.atcmd('AT+NETWORKID?').then(data => {
    return parseInt(data.slice(11));
  });
};

/*
  Set password for communication. This is a 32 character long hex string that
  represents the 16 byte AES key used for encryption. Both LoRa modules need to
  use the same password in order to communicate.
*/
RYLR.prototype.setPassword = function(password) {
  return this.atcmd('AT+CPIN=' + password);
}

/*
  Get password.
*/
RYLR.prototype.getPassword = function() {
  return this.atcmd('AT+CPIN?').then(data => {
    return data.slice(6);
  });
};

/*
  Set RF power level in dBm. Valid range between 0 and 15 (inclusive).
*/
RYLR.prototype.setPower = function(power) {
  return this.atcmd('AT+CRFOP=' + power);
}

/*
  Get RF power level in dBm.
*/
RYLR.prototype.getPower = function() {
  return this.atcmd('AT+CRFOP?').then(data => {
    return parseInt(data.slice(7));
  });
};

/*
  Send data to optional address (defaults to 0).
*/
RYLR.prototype.send = function(data, address) {
  const len = data.length;
  if (address === undefined) {
    address = 0;
  }
  this.at.write('AT+SEND=' + address + ',' + len + ',' + data + '\r\n');
}

/*
  Get firmware version.
*/
RYLR.prototype.getVersion = function() {
  return this.atcmd('AT+VER?').then(data => {
    return data.slice(5);
  });
};

/*
  Reset device configuration to factory defaults.
*/
RYLR.prototype.setFactory = function() {
  return this.atcmd('AT+FACTORY');
}

/*
  Return a new RYLR LoRa connection object from a USART interface.
*/
exports.connect = usart => {
  return new RYLR(usart);
};
