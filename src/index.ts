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
    console.log("Creating DB");
    return batteryDB.createDatabase(dbname);
  }
  else{
    console.log("DB already exists");
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
   // console.log("No manufacturer data");
   // console.log(JSON.stringify(advertisement));
    return;
  }
  // Parse manufacturer ID
  const manufacturerID: Uint8Array = Uint8Array.from(advertisement.manufacturerData.slice(0, 2));

  // If ID is Ruuvi Innovations 0x0499
  if (manufacturerID[0] === 0x99 && manufacturerID[1] === 0x04) {
    const data: Uint8Array = Uint8Array.from(peripheral.advertisement.manufacturerData.slice(2));
    //console.log("Ruuvi data");
    // If data is battery data
    if (0xba === data[0]) {
      //console.log("Battery data");
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
        sample.tags.address = id;
        sample.fields.rssi = rssi;
        const tx: IPoint[] = [sample];
        batteryDB.writePoints(tx);
      } catch (e) {}
    }
  }
});
