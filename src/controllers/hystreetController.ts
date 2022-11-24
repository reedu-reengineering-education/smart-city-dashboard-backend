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
import { client } from '../lib/redis';
import HttpController, { IOptions } from './httpController';
import { isValidDate, updateQueryStringParameter } from '../utils';

interface IHystreetOptions extends IOptions {
  reqConfig: AxiosRequestConfig;
}

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
    public options: IHystreetOptions
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
    const to = new Date().toISOString();
    let url = updateQueryStringParameter(this.url, 'from', from);
    url = updateQueryStringParameter(url, 'to', to);
    try {
      const request = await axios.get(url, this.options.reqConfig);
      const data = await request.data;
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
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
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
      const request = await axios.get(url, this.options.reqConfig);
      const data = await request.data;
      return JSON.stringify({
        ...data,
        metadata: {
          ...data.metadata,
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
