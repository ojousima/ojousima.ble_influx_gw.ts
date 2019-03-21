import { FieldType, IPoint, ISingleHostConfig } from 'influx';
import { RuuviTagBroadcast } from 'ojousima.ruuvi_endpoints.ts';
import { InfluxLogin } from '../config';

const login = new InfluxLogin();
const measurementName = 'ruuvi_siunits';

export const RuuviOptions: ISingleHostConfig = {
  database: 'ruuvi',
  host: login.host,
  password: login.password,
  port: login.port,
  schema: [
    {
      fields: {
        accelerationXG: FieldType.FLOAT,
        accelerationYG: FieldType.FLOAT,
        accelerationZG: FieldType.FLOAT,
        batteryVoltageV: FieldType.FLOAT,
        humidityRh: FieldType.FLOAT,
        measurementSequenceNumber: FieldType.INTEGER,
        movementCounter: FieldType.INTEGER,
        pressurePa: FieldType.FLOAT,
        rssiDB: FieldType.INTEGER,
        temperatureC: FieldType.FLOAT,
        txPowerDBm: FieldType.INTEGER
      },
      measurement: measurementName,
      tags: ['address', 'gatewayID', 'dataFormat'],
    },
  ],
  username: login.username,
};

export function RuuviTagBroadcastToInflux(broadcast: RuuviTagBroadcast): IPoint {
  const data: IPoint = {
    fields: {
      accelerationXG: broadcast.accelerationXG,
      accelerationYG: broadcast.accelerationYG,
      accelerationZG: broadcast.accelerationZG,
      batteryVoltageV: broadcast.batteryVoltageV,
      humidityRh: broadcast.humidityRh,
      measurementSequenceNumber: broadcast.measurementSequence,
      movementCounter: broadcast.movementCounter,
      pressurePa: broadcast.pressurePa,
      rssiDB: broadcast.rssiDB,
      temperatureC: broadcast.temperatureC,
      txPowerDBm: broadcast.txPowerDBm
    },
    measurement: measurementName,
    tags: {},
  };

  return data;
}
