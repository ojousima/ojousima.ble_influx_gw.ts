import { InfluxLogin }  from "../config"
import { FieldType, ISingleHostConfig, IPoint } from "influx";
import { BatteryBroadcast }  from "ojousima.ruuvi_endpoints.ts"

const login = new InfluxLogin();
const measurementName = 'Battery';

export const BatteryOptions: ISingleHostConfig = {
  database: 'battery',
  host: login.host,
  password: login.password,
  port: login.port,
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
  }],
  username: login.username
}

export function BroadcastToInflux(broadcast: BatteryBroadcast): IPoint
{
  let data: IPoint = {
    measurement: measurementName,
    fields: {
      droopVoltageV: broadcast.droopVoltageV,
      humidityRH: broadcast.humidityRh,
      measurementSequenceNumber: broadcast.measurementSequence,
      radioVoltageV: broadcast.radioVoltageV,
      simpleVoltageV: broadcast.simpleVoltageV,
      temperatureC: broadcast.temperatureC
    },
    tags: {

    }
  };

  return data;
}