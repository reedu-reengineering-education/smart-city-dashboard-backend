import axios from 'axios';
import BaseController from './baseController';
import { client } from '../helper/dbHelper';

/**
 * @description HttpController fetches and updates json data from http(s) endpoints. It extends the abstract BaseController
 */
export default class HttpController extends BaseController {
  /**
   * @description Fetches JSON data from endpoints and updates redisDB
   */
  public async update(): Promise<boolean> {
    try {
      const request = await axios.get(this.url);
      const data = await request.data;
      return await client.set(this.key, JSON.stringify(data));
    } catch (error) {
      return new Promise<boolean>((resolve, reject) => {
        reject(error);
      });
    }
  }
}
