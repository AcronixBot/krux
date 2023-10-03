import Splatnet3Manager, { QueryCodes } from "../nso/Splatnet.js";
import NsoManager from "../nso/Nso.js";
import ImageManager from "./ImageManager.js";
import Logger from "./Logger.js";
import Util, { ILocal, locales } from "./Util.js";
import jsonpath from "jsonpath";
import { GraphQLResponse } from "splatnet3-types/dist/graphql";
import {
  CoopResult,
  FestRecordResult,
  SaleGearDetailResult,
  StageScheduleResult,
} from "splatnet3-types/dist/splatnet3";

export type AllowdGraphQlResponses = GraphQLResponse<CoopResult | StageScheduleResult | FestRecordResult | SaleGearDetailResult>

export default class DataUpdateManager {
  private ImageManager = new ImageManager();
  private NsoManager: NsoManager;
  private Util = Util;

  imagePaths = [];
  derivedIds = [];

  constructor(region?: string) {
    this.NsoManager = NsoManager.manager(region ?? null);
  }

  get regionOrLocale() {
    return this.NsoManager.region;
  }

  splatnet3(locale?: locales) {
    locale ??= this.Util.defaultLocale.code;
    return new Splatnet3Manager(this.NsoManager, locale);
  }

  async getData(locale: ILocal, query: QueryCodes) {
    return await this.splatnet3(locale.code).getGraphQlQuery(query);
  }

  async update() {
    Logger.info("Starting the Data Update", "DataUpdater");

    try {
      for (const key of Object.entries(QueryCodes)) {
        let data = await this.getData(this.Util.defaultLocale, key[1]) as AllowdGraphQlResponses;

        this.deriveIds(data);

        await this.downloadImages(data);

        await this.safeData(data);

        Logger.info("Done", "DataUpdater");
      }
    } catch (e) {
      return Logger.error(e, "DataUpdater");
    }
  }

  deriveIds(data: AllowdGraphQlResponses) {
    for (let expression of this.derivedIds) {
      jsonpath.apply(data, expression, this.Util.deriveId);
    }
  }

  async downloadImages(
    data: AllowdGraphQlResponses
  ) {
    const images = {};

    for (const expression of this.imagePaths) {
      let mapping = {};
      for (const url of jsonpath.query(data, expression)) {
        let [path, publicUrl] = await this.ImageManager.process(url);
        mapping[url] = publicUrl;
        images[publicUrl] = path;
      }

      jsonpath.apply(data, expression, (url: string | number) => mapping[url]);
    }

    return images;
  }

  async safeData(data: AllowdGraphQlResponses) {
    let s = JSON.stringify(data, undefined, 2);

    // TODO Safe data in cache
  }
}
