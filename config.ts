import { ISingleHostConfig } from "influx";

export class InfluxLogin {
  public readonly host: string;
  public readonly port: number;
  // Leave username and pw as '' if not used
  public readonly username: string;
  public readonly password: string;

  public constructor(
    host: string = 'localhost',
    port: number = 8086,
    username: string = '',
    password: string = ''
  ) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }
}