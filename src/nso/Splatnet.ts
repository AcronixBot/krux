import Logger from "../util/Logger.js";
import NsoManager from "./Nso.js";
import Cache from "../util/VirtualCache.js";
interface BulletToken {
  bulletToken: string;
  lang: string;
  is_noe_country: "true" | "false";
}

interface BulletTokenData {
  expire: number;
  bullettoken: BulletToken;
}

export enum QueryCodes {
  COOP = "0f8c33970a425683bb1bdecca50a0ca4fb3c3641c0b2a1237aedfde9c0cb2b8f",
  SCHEDULES = "9b6b90568f990b2a14f04c25dd6eb53b35cc12ac815db85ececfccee64215edd",
  FEST = "c8660a636e73dcbf55c12932bc301b1c9db2aa9a78939ff61bf77a0ea8ff0a88",
  GEAR = "d6f94d4c05a111957bcd65f8649d628b02bf32d81f26f1d5b56eaef438e55bab",
}

export default class Splatnet3Manager {
  public static SplatNet3WebServiceId = 4834290508791808;
  public static baseUrl = "https://api.lp1.av5ja.srv.nintendo.net";
  public static webViewVersion = "4.0.0-d5178440";

  private NsoManager: NsoManager;
  private bulletToken: BulletToken;
  private acceptLanguage: string;

  constructor(nsoClient: NsoManager, acceptLanguage?: string) {
    this.NsoManager = nsoClient;
    acceptLanguage
      ? (this.acceptLanguage = acceptLanguage)
      : (this.acceptLanguage = "en-US");
  }

  /**
   * what i need
   * - bullet token generator
   *      - generator (api request) and cache (from class)
   *
   * - graphQl
   *      - request manager
   */

  calculateExpire(expires: number) {
    let expire = Date.now() + expires * 1000;
    return expire - 5 * 60 * 1000;
  }

  //bullet token

  getOrCreateBulletTokenCache() {
    return new Cache<BulletTokenData>("bullettoken_cache");
  }

  async start() {
    if (!this.bulletToken) {
      this.bulletToken = await this.getBulletToken();
    }
  }

  async getBulletToken() {
    let tokenCache = this.getOrCreateBulletTokenCache();
    let bulletToken = (tokenCache.getData("bullettoken") as BulletTokenData).bullettoken; //TODO find out why i dont get a bullet token

    if (!bulletToken) {
      let webservicetoken = await this.NsoManager.getWebServiceToken(
        Splatnet3Manager.SplatNet3WebServiceId
      );
      this.createBulletToken(tokenCache, webservicetoken).then(
        async (result) => {
          if (result?.bulletToken) {
            bulletToken = result;
          } else {
            return Logger.error(
              "Could get a Bullet Token. Cache is empty and generation wasn't successfully!",
              "Splatnet"
            );
          }
        }
      );
    }

    return bulletToken;
  }

  async createBulletToken(
    cache: Cache<BulletTokenData>,
    webservicetoken: string
  ) {
    Logger.info("Creating a Bullet Token", "Splatnet");

    let request = await fetch(Splatnet3Manager.baseUrl + `/api/bullet_tokens`, {
      method: "POST",
      headers: {
        "X-Web-View-Ver": Splatnet3Manager.webViewVersion,
        "X-NACOUNTRY": "US",
        "X-GameWebToken": webservicetoken,
        "Accept-Language": this.acceptLanguage,
        'User-Agent': process.env.NINTENDO_USER_AGENT,
      },
    });

    if (!request.ok)
      Logger.warn(
        `Bullet Token generation stopped with a non 200 Code. Code: ${request.status}`,
        "Splatnet"
      );

    let bullettoken = (await request.json()) as BulletToken;
    let expire = this.calculateExpire(7200);

    cache.setData({
      bullettoken,
      expire,
    });

    Logger.info("Successfully created a new Bullet Token", "Splatnet");

    return bullettoken;
  }

  //GraphQl

  //TODO create or import type or variables and body and responses

  async GraphQlRequest(
    version: number,
    sha256Hash: string,
    variables: unknown = {}
  ) {
    await this.start();

    let body: unknown = {
      extensions: { persistedQuery: { version, sha256Hash } },
      variables,
    };

    console.log()

    let graphQlRequest = await fetch(
      Splatnet3Manager.baseUrl + `/api/graphql`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.bulletToken.bulletToken}`,
          "X-Web-View-Ver": Splatnet3Manager.webViewVersion,
          "Content-Type": "application/json",
          "Accept-Language": this.acceptLanguage,
        },
        body: JSON.stringify(body),
      }
    );

    if (!graphQlRequest.ok)
      return Logger.warn(
        `GraphQl request stopped with a non 200 Code. Code: ${graphQlRequest.status}`,
        "Splatnet"
      );

    let response = await graphQlRequest.json();
    return response;
  }

  async getGraphQlQuery<T>(query: QueryCodes) {
    //TODO add type Support for more Querry
    return (await this.GraphQlRequest(1, query)) as T;
  }
}
