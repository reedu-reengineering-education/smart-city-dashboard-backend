import axios, { AxiosRequestConfig } from 'axios';
import BaseController from './baseController';
import { client } from '../lib/redis';
import { isValidDate, updateQueryStringParameter } from '../utils';

export interface IOptions {
  reqConfig?: AxiosRequestConfig;
}

export interface Channel {
  id: number;
  name: string;
  domainId: number;
  domain: string;
  latitude: number;
  longitude: number;
  userType: number;
  timezone: string;
  interval: number;
  sens: number;
  installationDate: Date;
  photos?: any;
  counter: string;
  type: string;
  visible?: any;
  channels?: any;
  tags?: any;
}

export interface Tag {
  id: number;
  name: string;
  description: string;
  color: string;
  domainId: number;
  username: string;
}

export interface EcoCounterData {
  id: number;
  name: string;
  domainId: number;
  domain: string;
  latitude: number;
  longitude: number;
  userType: number;
  timezone: string;
  interval: number;
  sens: number;
  installationDate: Date;
  photos: string[];
  counter: string;
  type: string;
  visible: boolean;
  channels: Channel[];
  tags: Tag[];
}

const COUNT_DATA_URL = (id: number) =>
  `https://apieco.eco-counter-tools.com/api/1.0/data/site/${id}`;

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class EcoCounterController extends BaseController {
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
  public async update(): Promise<boolean[]> {
    try {
      const request = await axios.get(this.url, this.options?.reqConfig ?? {});
      let data = await request.data;

      const counterPromises: Promise<boolean>[] = data.map(
        async (counter: EcoCounterData) => {
          const fromRaw = new Date();
          fromRaw.setDate(fromRaw.getDate() - 7);
          fromRaw.setHours(0);
          fromRaw.setMinutes(0);
          fromRaw.setSeconds(0);
          const from = fromRaw.toISOString().slice(0, -5); // removing milliseconds to match ISO 8601
          let url = updateQueryStringParameter(
            COUNT_DATA_URL(counter.id),
            'begin',
            from
          );
          url = updateQueryStringParameter(url, 'step', 'day');

          const countDataRequest = await axios.get(
            url,
            this.options?.reqConfig ?? {}
          );
          const countData = await countDataRequest.data;

          return await client.set(
            `${this.key}_${counter.id}`,
            JSON.stringify(countData)
          );
        }
      );

      return await Promise.all<boolean>([
        ...counterPromises,
        await client.set(this.key, JSON.stringify(data)),
      ]);
    } catch (error) {
      return new Promise<boolean[]>((resolve, reject) => {
        reject(error);
      });
    }
  }

  /**
   * @description returns time series data from date to now
   */
  public async getTimeSeriesData(from: Date): Promise<any> {
    if (!isValidDate(from)) {
      return new Promise<boolean>((resolve, reject) => {
        reject('Invalid Date');
      });
    }
    try {
      const request = await axios.get(this.url, this.options?.reqConfig ?? {});
      let data = await request.data;

      const counterPromises: Promise<any>[] = data.map(
        async (counter: EcoCounterData) => {
          const fromRaw = new Date(from);
          fromRaw.setHours(0);
          fromRaw.setMinutes(0);
          fromRaw.setSeconds(0);
          const fromDate = fromRaw.toISOString().slice(0, -5); // removing milliseconds to match ISO 8601

          let url = updateQueryStringParameter(
            COUNT_DATA_URL(counter.id),
            'begin',
            fromDate
          );

          const diffInMs = Date.now() - +new Date(fromRaw);
          const diffInDays = Math.floor(diffInMs / (1000 * 3600 * 24));
          if (diffInDays > 7) {
            url = updateQueryStringParameter(url, 'step', 'day');
          } else {
            url = updateQueryStringParameter(url, 'step', 'hour');
          }

          const countDataRequest = await axios.get(
            url,
            this.options?.reqConfig ?? {}
          );
          return {
            ...counter,
            data: await countDataRequest.data,
          };
        }
      );

      return await Promise.all<any>(counterPromises);
    } catch (error) {
      return new Promise<any>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
