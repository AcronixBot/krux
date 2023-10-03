//import CoralApi as named import for intellisense
import { addUserAgent } from "nxapi";
import Logger from "../util/Logger.js";
import Cache from "../util/VirtualCache.js";
import { CoralAuthData } from "nxapi/dist/api/coral";
import { locales } from "src/util/Util.js";
/** @ts-ignore */
import CoralApi from "nxapi/coral";

interface CoralAuthSafeData {
  data: CoralAuthData;
  expires: number;
}

interface WebservicetokenData {
  accessToken: string;
  expiresIn: number;
}

export function regionTokens() {
  return {
    EU: process.env.splatoon3EUsessionToken,
  };
}

function getDefaultRegion() {
  for (const [region, token] of Object.entries(regionTokens())) {
    if (token) return region;
  }

  throw new Error("Session token not set for any region");
}

export default class NsoManager {
  logger = new Logger();
  sessionToken: string;
  region: string;
  cacheName = "nso";

  constructor(sessionToken: string, region: locales) {
    addUserAgent(process.env.USERAGENT);

    this.sessionToken = sessionToken;
    this.region = region;
  }

  static manager(region = null) {
    region ??= getDefaultRegion();
    let tokens = regionTokens();

    if (!Object.keys(tokens).includes(region)) {
      throw new Error(`Invalid region: ${region}`);
    }

    let token = tokens[region];
    if (!token) {
      throw new Error(`Token not set for region: ${region}`);
    }

    return new NsoManager(token, region);
  }

  calculateExpire(expires: number) {
    let expire = Date.now() + expires * 1000;
    return expire - 5 * 60 * 1000;
  }

  getOrCreateCoralCache() {
    return new Cache<CoralAuthSafeData>("coral_cache");
  }

  async coralSession() {
    Logger.info("Creating Coral session...", "Nso");

    let { data } = await CoralApi.createWithSessionToken(this.sessionToken);
    let expire = this.calculateExpire(data.credential.expiresIn);

    Logger.info(`Caching Coral session until: ${expire}`, "Nso");

    this.getOrCreateCoralCache().setData({ data, expires: expire });

    return data;
  }

  async useCoralApi() {
    let data = (
      this.getOrCreateCoralCache().getData("coral") as CoralAuthSafeData
    ).data;
    if (!data) data = await this.coralSession();
    return CoralApi.createWithSavedToken(data);
  }

  //Web Service Token
  getOrCreateTokenCache() {
    return new Cache<WebservicetokenData>(`webservicetoken_cache`);
  }

  async useWebServiceToken(id: number) {
    let coral = await this.useCoralApi();
    Logger.info(`Creating web service token for ID ${id}...`, "Nso");

    let { accessToken, expiresIn } = await coral.getWebServiceToken(id);

    let expire = this.calculateExpire(expiresIn);
    Logger.info(`Caching web service token for ID ${id} until: ${expire}`, "Nso");
    this.getOrCreateTokenCache().setData({ accessToken, expiresIn });

    return {
      accessToken,
      expiresIn,
    };
  }

  async getWebServiceToken(id: number) {
    let cache = this.getOrCreateTokenCache();
    let accessToken = (cache.getData(`webservicetoken`) as WebservicetokenData)
      .accessToken;
    if (!accessToken)
      accessToken = (await this.useWebServiceToken(id)).accessToken;

    return accessToken;
  }
}
