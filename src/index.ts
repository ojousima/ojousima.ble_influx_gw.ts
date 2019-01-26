import { FieldType, InfluxDB as Influx, IPoint, ISingleHostConfig } from 'influx';
import * as Noble from 'noble';
import { AccelerationBroadcast, BatteryBroadcast, dfacparser, dfbaparser } from 'ojousima.ruuvi_endpoints.ts';
import * as os from 'os';
import { AccelerationBroadcastToInflux, AccelerationOptions } from './accelerationdata';
import { BatteryBroadcastToInflux, BatteryOptions } from './batterydata';

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
batteryDB.getDatabaseNames().then(names => {
  const dbname: string = AccelerationOptions.database ? AccelerationOptions.database : 'misc';
  if (0 > names.indexOf(dbname)) {
    return accelerationDB.createDatabase(dbname);
  }
});

// Setup scanning
Noble.on('stateChange', state => {
  if (state !== 'poweredOn') {
    Noble.stopScanning();
  } else {
    Noble.startScanning([], true);
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
  const manufacturerID = view.getUint16(0, true);

  // If ID is Ruuvi Innovations 0x0499
  if (0x0499 === manufacturerID) {
    const data: Uint8Array = Uint8Array.from(peripheral.advertisement.manufacturerData.slice(2));

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
        const tx: IPoint[] = [sample];
        batteryDB.writePoints(tx);
      } catch (e) {}
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
        const tx: IPoint[] = [sample];
        batteryDB.writePoints(tx);
      } catch (e) {}
    }
  }
});
