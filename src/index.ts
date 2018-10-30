import { InfluxDB as Influx, ISingleHostConfig, FieldType, IPoint } from "influx";
import { BatteryBroadcast, dfbaparser }  from "ojousima.ruuvi_endpoints.ts"
import { BatteryOptions, BroadcastToInflux} from "./batterydata"
import * as os from "os"
import * as Noble from "noble"

// Setup database connection
const batteryDB = new Influx(BatteryOptions);
batteryDB.getDatabaseNames()
  .then(names => {
    const dbname: string = BatteryOptions.database? BatteryOptions.database : "misc"
    if (0 > names.indexOf(dbname)) {
      batteryDB.createDatabase(dbname).then(value => {
        Noble.startScanning([], true);
      });
    }
    else {
      Noble.startScanning([], true);
    }
  });

// Setup scanning
Noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
  } else {
    console.log("Error in BLE scanning")
    Noble.stopScanning();
  }
});

Noble.on('discover', function(peripheral) {
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
  let view = new DataView(advertisement.manufacturerData.buffer);
  let manufacturerID = view.getUint16(0, true);

  // If ID is Ruuvi Innovations 0x0499
  if(0x0499 === manufacturerID)
  {
    const data: Uint8Array = Uint8Array.from(peripheral.advertisement.manufacturerData.slice(2));
    // If data is battery data
    if(0xBA === data[0])
    try
    {
      let BatteryData: BatteryBroadcast = dfbaparser(data);
      let sample: IPoint = BroadcastToInflux(BatteryData);
      if(undefined == sample.tags) { sample.tags = {}; }
      sample.tags.gatewayID = os.hostname();
      sample.tags.hostname  = id;
      const tx: IPoint[] = [sample];
      batteryDB.writePoints(tx);
    }catch(e) {};

  }
});