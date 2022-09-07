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
import BaseController from './baseController';
import { client } from '../lib/redis';

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
export default class HttpController extends BaseController {
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
      const request = await axios.get(this.url, this.options?.reqConfig ?? {});
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
}
