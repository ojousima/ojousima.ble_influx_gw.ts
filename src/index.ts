import { FieldType, InfluxDB as Influx, IPoint, ISingleHostConfig } from 'influx';
import * as Noble from 'noble';
import { BatteryBroadcast, dfbaparser } from 'ojousima.ruuvi_endpoints.ts';
import * as os from 'os';
import { BatteryOptions, BroadcastToInflux } from './batterydata';

// Setup database connection
const batteryDB = new Influx(BatteryOptions);
batteryDB.getDatabaseNames().then(names => {
  const dbname: string = BatteryOptions.database ? BatteryOptions.database : 'misc';
  if (0 > names.indexOf(dbname)) {
    batteryDB.createDatabase(dbname).then(value => {
      Noble.startScanning([], true);
    });
  } else {
    Noble.startScanning([], true);
  }
});

// Setup scanning
Noble.on('stateChange', state => {
  if (state !== 'poweredOn') {
    Noble.stopScanning();
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

  // Parse manufacturer ID
  const view = new DataView(advertisement.manufacturerData.buffer);
  const manufacturerID = view.getUint16(0, true);

  // If ID is Ruuvi Innovations 0x0499
  if (0x0499 === manufacturerID) {
    const data: Uint8Array = Uint8Array.from(peripheral.advertisement.manufacturerData.slice(2));
    // If data is battery data
    if (0xba === data[0]) {
      try {
        const BatteryData: BatteryBroadcast = dfbaparser(data);
        const sample: IPoint = BroadcastToInflux(BatteryData);
        if (undefined === sample.tags) {
          sample.tags = {};
        }
        if (undefined === sample.fields) {
          sample.fields = {};
        }
        sample.tags.gatewayID = os.hostname();
        sample.tags.hostname = id;
        sample.fields.rssi = rssi;
        const tx: IPoint[] = [sample];
        batteryDB.writePoints(tx);
      } catch (e) {}
    }
  }
});
