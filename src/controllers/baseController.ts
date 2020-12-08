/**
 * @description BaseController defines an abstract controller
 * @abstract
 */
export default abstract class BaseController {
  /**
   * @description Creates new instance of a controller to fetch data
   * @param url url to request data from
   * @param key key to store response data in redisDB
   */
  constructor(public url: string, public key: string) {}

  /**
   * @abstract
   * @description Fetch new data and update redisDB
   * @returns Promise<boolean> whether update was successful
   */
  public abstract update(): Promise<boolean>;
}
