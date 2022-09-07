/**
 * Smart City Münster Dashboard
 * Copyright (C) 2022 Reedu GmbH & Co. KG
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { SMA } from 'downsample';

import { client } from '../lib/redis';
import { isValidDate, updateQueryStringParameter } from '../utils';
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

  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async getTimeSeriesData(from: Date, to: Date): Promise<any> {
    if (!isValidDate(from) && !isValidDate(to)) {
      return new Promise<boolean>((resolve, reject) => {
        reject('Invalid Date');
      });
    }
    let url = updateQueryStringParameter(
      this.url,
      'from-date',
      from.toISOString()
    );
    url = updateQueryStringParameter(url, 'to-date', to.toISOString());

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

      return new Promise((resolve) => resolve(smooth));
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
