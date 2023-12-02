import dotenv from 'dotenv';
dotenv.config();

import NsoManager from "../nso/Nso.js";
import ImageProcessor from "./ImageManager.js";
import Util from "./Util.js";
import VirtualCache from "./VirtualCache.js";
import Splatnet3Manager from "../nso/Splatnet.js";
import { QueryCodes } from "../nso/Splatnet.js";
import Logger from "./Logger.js";

import * as glob from "glob";
import * as fs from "fs";
import jsonpath from "jsonpath";

export default class DynamicUpdater<TQueryType> {
  //includes:
  // [ ] the data in Cache<T>
  // [ ] path to the safed file
  // [ ] methode to update the data
  // [ ] and all other stuff from the base class
  // [ ] On start of project check for files to load them befor actuall make a request
  // [ ] run the updater every hour

  private imageManager = new ImageProcessor();
  private nso: NsoManager;
  private util = Util;
  private cache: VirtualCache<TQueryType>;
  private splatnet3: Splatnet3Manager;

  private query: QueryCodes = QueryCodes.SCHEDULES;

  private imagePaths = [];
  private derivedIds = [];

  constructor(nso: NsoManager, splatnet: Splatnet3Manager, query?: QueryCodes) {
    this.nso = nso;
    this.splatnet3 = splatnet;
    this.query = query;

    this.cache = new VirtualCache<TQueryType>(`${this.query}_cache`);
  }

  get shortQuery() {
    return this.query.substring(0, 8);
  }

  async getData() {
    return await this.splatnet3.getGraphQlQuery<TQueryType>(this.query);
  }

  async update() {
    Logger.info(`Starting the Data Update`, `DataUpdater (${this.shortQuery})`);

    try {
      console.log('im try catch')
      let data = await this.getData();
      console.log('this.getData() macht probleme')
      this.deriveIds(data);

      await this.downloadImages(data);

      await this.safeData(data);

      Logger.info(`Done`, `DataUpdater (${this.shortQuery})`);
    } catch (e) {
      return Logger.error(e, `DataUpdater (${this.shortQuery})`);
    }
  }

  deriveIds(data: TQueryType) {
    for (let expression of this.derivedIds) {
      jsonpath.apply(data, expression, this.util.deriveId);
    }
  }

  async downloadImages(data: TQueryType) {
    const images = {};

    for (const expression of this.imagePaths) {
      let mapping = {};
      for (const url of jsonpath.query(data, expression)) {
        let [path, publicUrl] = await this.imageManager.process(url);
        mapping[url] = publicUrl;
        images[publicUrl] = path;
      }

      jsonpath.apply(data, expression, (url: string | number) => mapping[url]);
    }

    return images;
  }

  async safeData(data: TQueryType) {
    //first safe the data in the cache
    const cache = this.cache.setData(data);

    //then write the json data into a file
    let stringifiedData = JSON.stringify(cache.getData(), undefined, 2);

    const fileName = `${this.shortQuery}_cache_${Date.now()}.json`;

    fs.writeFile(fileName, stringifiedData, () => {
      Logger.info(
        `Safed Data in ${fileName}`,
        `DataUpdater (${this.shortQuery})`
      );
    });

    //return the cache
    return cache;
  }

  async isLatestFileValid(): Promise<boolean> {
    const now = Date.now();
    const wildcard = `${this.shortQuery}_cache_*.json`;

    const matchingFilePaths = glob.globSync(wildcard);
    if (matchingFilePaths.length === 0) return false;

    for (const filePath of matchingFilePaths) {

    }
    return false;
  }

  async getDataFromFile() {
    // check for file with wildcard because of Date.now()
    // -> '<query>_cache_*.json' maybe

    //if file:
    // if differney between date in name and Date.now bigger then one hour return null
    // else return file content
    // else return null

    const now = Date.now();
    const wildcardPattern = `${this.shortQuery}_cache_*.json`;

    // Find files matching the wildcard pattern
    const matchingFiles = glob.sync(wildcardPattern);

    if (matchingFiles.length === 0) {
      return null;
    }

    // Check if the time difference between the first matching file's date in the name and now is greater than one hour (3600000 milliseconds)
    const firstMatchingFile = matchingFiles[0];
    const fileName = firstMatchingFile;
    const datePart = fileName.match(/\d{13}/);

    if (datePart) {
      const fileTimestamp = parseInt(datePart[0], 10);
      if (now - fileTimestamp > 3600000) {
        return null;
      }
    }

    // Read and return the content of the first matching file
    const fileContent = fs.readFileSync(fileName, "utf-8");
    return fileContent;
  }
}
