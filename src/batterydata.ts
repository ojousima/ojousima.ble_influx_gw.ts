import { FieldType, IPoint, ISingleHostConfig } from 'influx';
import { BatteryBroadcast } from 'ojousima.ruuvi_endpoints.ts';
import { InfluxLogin } from '../config';

const login = new InfluxLogin();
const measurementName = 'Battery';

export const BatteryOptions: ISingleHostConfig = {
  database: 'battery',
  host: login.host,
  password: login.password,
  port: login.port,
  schema: [
    {
      fields: {
        droopVoltageV: FieldType.FLOAT,
        humidityRH: FieldType.FLOAT,
        measurementSequenceNumber: FieldType.INTEGER,
        radioVoltageV: FieldType.FLOAT,
        rssi: FieldType.INTEGER,
        simpleVoltageV: FieldType.FLOAT,
        temperatureC: FieldType.FLOAT,
      },
      measurement: measurementName,
      tags: ['gatewayID', 'address', 'dataFormat'],
    },
  ],
  username: login.username,
};

export function BatteryBroadcastToInflux(broadcast: BatteryBroadcast): IPoint {
  const data: IPoint = {
    fields: {
      droopVoltageV: broadcast.droopVoltageV,
      humidityRH: broadcast.humidityRh,
      measurementSequenceNumber: broadcast.measurementSequence,
      radioVoltageV: broadcast.radioVoltageV,
      simpleVoltageV: broadcast.simpleVoltageV,
      temperatureC: broadcast.temperatureC,
    },
    measurement: measurementName,
    tags: {},
  };

  return data;
}
