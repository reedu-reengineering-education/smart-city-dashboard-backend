import axios, { AxiosRequestConfig } from 'axios';
import BaseController from './baseController';
import { client } from '../helper/dbHelper';

interface ILocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class HttpController extends BaseController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param {string} url url to request data from
   * @param {string} key key to store response data in redisDB
   * @param {ILocation} [location] optional location object
   */
  constructor(
    public url: string,
    public key: string,
    public location?: ILocation
  ) {
    super(url, key);
  }

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    try {
      const request = await axios.get(this.url);
      const data = await request.data;

      if (this.location) {
        return await client.set(
          this.key,
          JSON.stringify({
            ...data,
            metadata: {
              ...data.metadata,
              location: this.location,
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
}
