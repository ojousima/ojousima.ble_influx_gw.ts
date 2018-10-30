import { InfluxLogin }  from "../config"
import { ISingleHostConfig, IPoint, FieldType } from "influx";
import { BatteryBroadcast }  from "ojousima.ruuvi_endpoints.ts"

const login = new InfluxLogin();
const measurementName = 'Battery';

export const BatteryOptions: ISingleHostConfig = {
  host: login.host,
  database: 'battery',
  port: login.port,
  username: login.username,
  password: login.password,
  schema: [{
    measurement: measurementName,
    fields: {
      simpleVoltageV:            FieldType.FLOAT,
      radioVoltageV:             FieldType.FLOAT,
      droopVoltageV:             FieldType.FLOAT,
      temperatureC:              FieldType.FLOAT,
      humidityRH:                FieldType.FLOAT,
      measurementSequenceNumber: FieldType.INTEGER,
      rssi:                      FieldType.INTEGER
    },
    tags: [
     'gatewayID',
     'address'
    ]
  }]
}

export function BroadcastToInflux(broadcast: BatteryBroadcast): IPoint
{
  let data: IPoint = {
    measurement: measurementName,
    fields: {
      simpleVoltageV: broadcast.simpleVoltageV,
      radioVoltageV: broadcast.radioVoltageV,
      droopVoltageV: broadcast.droopVoltageV,
      temperatureC: broadcast.temperatureC,
      humidityRH: broadcast.humidityRh,
      measurementSequenceNumber: broadcast.measurementSequence
    },
    tags: {

    }
  };

  return data;
}