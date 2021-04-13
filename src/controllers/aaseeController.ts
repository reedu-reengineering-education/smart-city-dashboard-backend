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
      const request = await axios.post(
        this.url,
        { ...this.options.postBody, from },
        this.options?.reqConfig ?? {}
      );
      let data = await request.data;

      if (this.options?.formatter) {
        data = this.options.formatter(data);
      }

      return data;
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
