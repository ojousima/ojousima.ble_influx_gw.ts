import { IPoint } from 'influx';
import { BatteryBroadcast } from 'ojousima.ruuvi_endpoints.ts';
import { BatteryBroadcastToInflux } from '../batterydata';

test('test_broadcastdata_assignment', () => {
  const broadcast: BatteryBroadcast = new BatteryBroadcast();
  broadcast.droopVoltageV = 0.15;
  broadcast.radioVoltageV = 2.95;
  broadcast.simpleVoltageV = 2.801;
  broadcast.temperatureC = 25.32;
  broadcast.measurementSequence = 5;
  broadcast.humidityRh = 20.36;

  let data: IPoint = BatteryBroadcastToInflux(broadcast);
  expect(data.fields).toBeDefined();
  if (undefined === data.fields) {
    data.fields = {};
  }
  expect(data.fields.droopVoltageV).toBeCloseTo(0.15, 3);
  expect(data.fields.radioVoltageV).toBeCloseTo(2.95, 3);
  expect(data.fields.simpleVoltageV).toBeCloseTo(2.801, 3);
  expect(data.fields.temperatureC).toBeCloseTo(25.32, 2);
  expect(data.fields.humidityRH).toBeCloseTo(20.36, 2);
  expect(data.fields.measurementSequenceNumber).toBe(5);
});
