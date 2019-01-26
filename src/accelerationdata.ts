import { FieldType, IPoint, ISingleHostConfig } from 'influx';
import { AccelerationBroadcast } from 'ojousima.ruuvi_endpoints.ts';
import { InfluxLogin } from '../config';

const login = new InfluxLogin();
const measurementName = 'Acceleration';

export const AccelerationOptions: ISingleHostConfig = {
  database: 'acceleration',
  host: login.host,
  password: login.password,
  port: login.port,
  schema: [
    {
      fields: {
        batteryVoltageV: FieldType.FLOAT,
        devXG: FieldType.FLOAT,
        devYG: FieldType.FLOAT,
        devZG: FieldType.FLOAT,
        measurementSequenceNumber: FieldType.INTEGER,
        p2pXG: FieldType.FLOAT,
        p2pYG: FieldType.FLOAT,
        p2pZG: FieldType.FLOAT,
        rmsXG: FieldType.FLOAT,
        rmsYG: FieldType.FLOAT,
        rmsZG: FieldType.FLOAT,
        rssi: FieldType.INTEGER,
        version: FieldType.INTEGER,
      },
      measurement: measurementName,
      tags: ['gatewayID', 'address'],
    },
  ],
  username: login.username,
};

export function AccelerationBroadcastToInflux(broadcast: AccelerationBroadcast): IPoint {
  const data: IPoint = {
    fields: {
      batteryVoltageV: broadcast.batteryVoltageV,
      devXG: broadcast.devXG,
      devYG: broadcast.devYG,
      devZG: broadcast.devZG,
      measurementSequenceNumber: broadcast.measurementSequence,
      p2pXG: broadcast.p2pXG,
      p2pYG: broadcast.p2pYG,
      p2pZG: broadcast.p2pZG,
      rmsXG: broadcast.rmsXG,
      rmsYG: broadcast.rmsYG,
      rmsZG: broadcast.rmsZG,
      rssi: broadcast.rssiDB,
      version: broadcast.version,
    },
    measurement: measurementName,
    tags: {},
  };

  return data;
}
