import axios, { AxiosRequestConfig } from 'axios';
import BaseController from './baseController';
import { client } from '../helper/dbHelper';
import HttpController from './httpController';

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class HystreetController extends HttpController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param url url to request data from
   * @param key key to store response data in redisDB
   */
  constructor(
    public url: string,
    public key: string,
    public location: any,
    public reqConfig?: AxiosRequestConfig
  ) {
    super(url, key);
  }

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    let fromRaw = new Date();
    fromRaw.setHours(fromRaw.getHours() - 1);
    const from = fromRaw.toISOString();
    const to = new Date().toISOString();
    let url = this.updateQueryStringParameter(this.url, 'from', from);
    url = this.updateQueryStringParameter(url, 'to', to);
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

  private updateQueryStringParameter(uri, key, value) {
    var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
    var separator = uri.indexOf('?') !== -1 ? '&' : '?';
    if (uri.match(re)) {
      return uri.replace(re, '$1' + key + '=' + value + '$2');
    } else {
      return uri + separator + key + '=' + value;
    }
  }
}
