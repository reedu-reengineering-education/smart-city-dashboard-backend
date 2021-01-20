import axios, { AxiosRequestConfig } from 'axios';
import { client } from '../helper/dbHelper';
import HttpController from './httpController';
import { updateQueryStringParameter } from '../helper/queryStringHelper';

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the HttpController
 */
export default class HystreetController extends HttpController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param {string} url url to request data from
   * @param {string} key key to store response data in redisDB
   * @param {ILocation} location location object
   * @param {AxiosRequestConfig} [reqConfig] optional axios request configuration
   */
  constructor(
    public url: string,
    public key: string,
    public location: any,
    public reqConfig?: AxiosRequestConfig
  ) {
    super(url, key, location);
  }

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    let fromRaw = new Date();
    fromRaw.setHours(fromRaw.getHours() - 24);
    const from = fromRaw.toISOString();
    const to = new Date().toISOString();
    let url = updateQueryStringParameter(this.url, 'from', from);
    url = updateQueryStringParameter(url, 'to', to);
    try {
      const request = await axios.get(url, this.reqConfig);
      const data = await request.data;
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
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
