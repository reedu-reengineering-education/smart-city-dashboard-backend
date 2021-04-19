import axios, { AxiosRequestConfig } from 'axios';
import BaseController from './baseController';
import { client } from '../lib/redis';
import HttpController from './httpController';
import {
  getDateArray,
  isValidDate,
  updateQueryStringParameter,
} from '../utils';
import csv from 'csvtojson';

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
}

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class ParkingController extends HttpController {
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

  public async getTimeSeriesData(from: Date, to: Date): Promise<any> {
    if (!isValidDate(from) && !isValidDate(to)) {
      return new Promise<boolean>((resolve, reject) => {
        reject('Invalid Date');
      });
    }

    let url = updateQueryStringParameter(this.url, 'from', from.toISOString());
    url = updateQueryStringParameter(url, 'to', to.toISOString());
    try {
      const dates = getDateArray(from, to);

      const data = await Promise.all(
        await dates.map(async (date: Date) => {
          try {
            const request = await axios.get(
              `https://raw.githubusercontent.com/codeformuenster/parking-decks-muenster/master/data/${
                date.toISOString().split('T')[0]
              }.csv`,
              this.options.reqConfig
            );
            if (request.status == 404) return;
            const data = await request.data;
            const csvData = await csv().fromString(data);

            return Object.keys(csvData).map((key) => ({
              ...csvData[key],
              timestamp: csvData[key]['Datum und Uhrzeit'],
            }));
          } catch (e) {}
        })
      );

      return JSON.stringify({
        data: data.flat(),
        metadata: {
          location: this.options.location,
        },
      });
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
