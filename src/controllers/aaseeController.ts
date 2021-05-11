import axios, { AxiosRequestConfig } from 'axios';
import BaseController from './baseController';
import { client } from '../lib/redis';
import { isValidDate } from '../utils';

interface ILocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface IDataFormatterFunction {
  (data: any): any;
}

export interface IOptions {
  location?: ILocation;
  formatter?: IDataFormatterFunction;
  reqConfig?: AxiosRequestConfig;
  postBody: any;
}

/**
 * @description AaseeController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class AaseeController extends BaseController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param {string} url url to request data from
   * @param {string} key key to store response data in redisDB
   * @param {IOptions} [options] optional options
   */
  constructor(
    public url: string,
    public key: string,
    public options?: IOptions
  ) {
    super(url, key);
  }

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    try {
      const request = await axios.post(
        this.url,
        this.options.postBody,
        this.options?.reqConfig ?? {}
      );
      let data = await request.data;

      if (this.options?.formatter) {
        data = this.options.formatter(data);
      }

      if (this.options?.location) {
        return await client.set(
          this.key,
          JSON.stringify({
            ...data,
            metadata: {
              ...data.metadata,
              location: this.options.location,
            },
          })
        );
      }

      return await client.set(this.key, JSON.stringify(data));
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }

  public async getTimeSeriesData(from: Date): Promise<any> {
    if (!isValidDate(from)) {
      return new Promise<boolean>((resolve, reject) => {
        reject('Invalid Date');
      });
    }

    try {
      let data = [];

      // get range from to (with current time as last element)
      let dateRange = this.getDateRange(from, new Date());
      dateRange[dateRange.length - 1] = new Date();

      // loop trough date ranges and fetch data in pairs (from-to)
      for (var i = 0; i < dateRange.length - 1; i++) {
        const curr = dateRange[i];
        const next = dateRange[i + 1];

        const request = await axios.post(
          this.url,
          { ...this.options.postBody, from: curr, to: next },
          this.options?.reqConfig ?? {}
        );

        const timeRangeData = await request.data;
        data.push(timeRangeData);
      }

      // use first element as data to send and fill with all other datasets
      let first = data.shift();
      data.forEach((e) => {
        first.data.water_temperature.push(...e.data.water_temperature);
        first.data.dissolved_oxygen.push(...e.data.dissolved_oxygen);
        first.data.pH.push(...e.data.pH);
      });

      first.data.water_temperature.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      first.data.dissolved_oxygen.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      first.data.pH.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      return first;
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }

  /**
   * Get range of dates
   * @param {Date} start
   * @param {Date} end
   * @returns {array}
   */
  private getDateRange = function (start: Date, end: Date) {
    for (
      var a = [], d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 2)
    ) {
      a.push(new Date(d));
    }
    return a;
  };
}
