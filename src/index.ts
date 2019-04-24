import { FieldType, InfluxDB as Influx, IPoint, ISingleHostConfig, toNanoDate } from 'influx';
import * as Noble from 'noble-mac';
import {
  AccelerationBroadcast,
  BatteryBroadcast,
  df3parser,
  df5parser,
  dfacparser,
  dfbaparser,
  RuuviTagBroadcast,
} from 'ojousima.ruuvi_endpoints.ts';
import * as os from 'os';
import { AccelerationBroadcastToInflux, AccelerationOptions } from './accelerationdata';
import { BatteryBroadcastToInflux, BatteryOptions } from './batterydata';
import { RuuviOptions, RuuviTagBroadcastToInflux } from './ruuvidata';

interface IQueue {
    [key: string]: IPoint[];
};
let queue: IQueue = {};
const batchSize: number = 2000;
let last_flush: number = 0;
// Batch points to be written,
const queuePoint = function(db: string, sample: IPoint){
  
  if(!queue[db.toString()])
  {
    console.log(`Creating queue for ${db}`);
    queue[db] = [];
  }
  const length = queue[db.toString()].push(sample);
  if(length >= batchSize || (new Date).getTime() - last_flush > 10000)
  {
    ruuviDB.writePoints(queue[db.toString()]);
    queue[db] = [];
    console.log("Sending batch");
    last_flush = (new Date).getTime();
  }
}

// Setup database connection
const batteryDB = new Influx(BatteryOptions);
batteryDB.getDatabaseNames().then(names => {
  const dbname: string = BatteryOptions.database ? BatteryOptions.database : 'misc';
  if (0 > names.indexOf(dbname)) {
    return batteryDB.createDatabase(dbname);
  }
});

// Setup database connection
const accelerationDB = new Influx(AccelerationOptions);
accelerationDB.getDatabaseNames().then(names => {
  const dbname: string = AccelerationOptions.database ? AccelerationOptions.database : 'misc';
  if (0 > names.indexOf(dbname)) {
    return accelerationDB.createDatabase(dbname);
  }
});

// Setup database connection
const ruuviDB = new Influx(RuuviOptions);
ruuviDB.getDatabaseNames().then(names => {
  const dbname: string = RuuviOptions.database ? RuuviOptions.database : 'misc';
  if (0 > names.indexOf(dbname)) {
    return ruuviDB.createDatabase(dbname);
  }
});

// Setup scanning
Noble.on('stateChange', state => {
  if (state !== 'poweredOn') {
    Noble.stopScanning();
    // console.log("Scan stopped");
  } else {
    Noble.startScanning([], true);
    // console.log("Scan started");
  }
});

Noble.on('discover', peripheral => {
  const advertisement = peripheral.advertisement;
  const id = peripheral.id;
  const localName = advertisement.localName;
  const txPowerLevel = advertisement.txPowerLevel;
  const manufacturerData = advertisement.manufacturerData;
  const serviceData = advertisement.serviceData;
  const serviceUuids = advertisement.serviceUuids;
  const rssi = peripheral.rssi;
  const timestamp = Date.now();

  if (undefined === manufacturerData) {
    return;
  }

  // Parse manufacturer ID
  const view = new DataView(manufacturerData.buffer);
  // Parse manufacturer ID
  const manufacturerID: Uint8Array = Uint8Array.from(advertisement.manufacturerData.slice(0, 2));

  // If ID is Ruuvi Innovations 0x0499
  if (manufacturerID[0] === 0x99 && manufacturerID[1] === 0x04) {
    const data: Uint8Array = Uint8Array.from(peripheral.advertisement.manufacturerData.slice(2));
    const now = new Date().getTime();
    // If data is acceleration data
    if (0xac === data[0]) {
      try {
        const AccelerationData: AccelerationBroadcast = dfacparser(data);
        const sample: IPoint = AccelerationBroadcastToInflux(AccelerationData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.address = id;
        sample.fields.rssi = rssi;
        sample.tags.dataFormat = data[0].toString();
        sample.timestamp = toNanoDate((now * 1000000).toString()).getNanoTime();
        const tx: IPoint[] = [sample];
        accelerationDB.writePoints(tx);
      } catch (e) {
        console.error(`${e} thrown`);
      }
    }

    // If data is battery data
    if (0xba === data[0]) {
      try {
        const BatteryData: BatteryBroadcast = dfbaparser(data);
        const sample: IPoint = BatteryBroadcastToInflux(BatteryData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.address = id;
        sample.fields.rssi = rssi;
        sample.tags.dataFormat = data[0].toString();
        sample.timestamp = toNanoDate((now * 1000000).toString()).getNanoTime();
        const tx: IPoint[] = [sample];
        batteryDB.writePoints(tx);
      } catch (e) {
        console.error(`${e} thrown`);
      }
    }

    // If data is Ruuvi DF5 data
    if (0x05 === data[0]) {
      try {
        const RuuviData: RuuviTagBroadcast = df5parser(data);
        const sample: IPoint = RuuviTagBroadcastToInflux(RuuviData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.address = RuuviData.mac ? RuuviData.mac.toString(16) : id;
        sample.fields.mac = sample.tags.address;
        sample.fields.rssiDB = rssi;
        sample.tags.dataFormat = data[0].toString();
        sample.timestamp = toNanoDate((now * 1000000).toString()).getNanoTime();
        // const tx: IPoint[] = [sample];
        const dbName: string = RuuviOptions.database ? RuuviOptions.database : "misc";
        queuePoint(dbName, sample);
      } catch (e) {
        console.error(`${e} thrown`);
      }
    }

    // If data is Ruuvi DF3 data
    if (0x03 === data[0]) {
      try {
        const RuuviData: RuuviTagBroadcast = df3parser(data);
        const sample: IPoint = RuuviTagBroadcastToInflux(RuuviData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.address = id;
        sample.fields.rssiDB = rssi;
        sample.tags.dataFormat = data[0].toString();
        sample.timestamp = toNanoDate((now * 1000000).toString()).getNanoTime();
        const tx: IPoint[] = [sample];
        const dbName: string = RuuviOptions.database ? RuuviOptions.database : "misc";
        queuePoint(dbName, sample);
      } catch (e) {
        console.error(`${e} thrown`);
      }
    }
    // If data is Ruuvi DFFE data
    if (0xFE === data[0]) {
      try {
        const RuuviData: RuuviTagBroadcast = dffeparser(data);
        const sample: IPoint = RuuviTagBroadcastToInflux(RuuviData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.address = id;
        sample.fields.rssiDB = rssi;
        sample.tags.dataFormat = data[0].toString();
        sample.timestamp = toNanoDate((now * 1000000).toString()).getNanoTime();
        const tx: IPoint[] = [sample];
        const dbName: string = RuuviOptions.database ? RuuviOptions.database : "misc";
        queuePoint(dbName, sample);
      } catch (e) {
        console.error(`${e} thrown`);
      }
    }
  }
});

process.on('unhandledRejection', error => {
  console.error(`${error} thrown`);
  process.exit(1);
});
