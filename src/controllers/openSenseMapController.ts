import axios, { AxiosRequestConfig } from 'axios';
import { SMA } from 'downsample';

import { client } from '../helper/dbHelper';
import { updateQueryStringParameter } from '../helper/queryStringHelper';
import HttpController, { IOptions } from './httpController';

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class OpenSenseMapController extends HttpController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param url url to request data from
   * @param key key to store response data in redisDB
   */
  constructor(
    public url: string,
    public key: string,
    public options?: IOptions
  ) {
    super(url, key, options);
  }

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    let fromRaw = new Date();
    fromRaw.setHours(fromRaw.getHours() - 24);
    const from = fromRaw.toISOString();
    let url = updateQueryStringParameter(this.url, 'from-date', from);

    try {
      const request = await axios.get(url, this.options?.reqConfig || {});
      const data = [
        ...(await request.data.map((x) => [
          new Date(x.createdAt),
          Number(x.value),
        ])),
      ];

      // downsample dataset and round values to 2 decimals
      const smooth = SMA(data, 48, 30).map((value: any) => ({
        ...value,
        y: Math.round(value.y * 100) / 100,
      }));

      return await client.set(this.key, JSON.stringify(smooth));
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
