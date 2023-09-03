import Logger from "../util/Logger";
import NsoManager from "./Nso";
import Cache from "../util/Cache";
import { GraphQLResponse } from "splatnet3-types/dist/graphql";
import { CoopResult, StageScheduleResult } from "splatnet3-types/dist/splatnet3";

interface BulletToken {
    bulletToken: string;
    lang: string;
    is_noe_country: 'true' | 'false';
}

interface BulletTokenData {
    expire: number
    bullettoken: BulletToken
}

export enum QueryCodes {
    COOP = "91b917becd2fa415890f5b47e15ffb15",
    SCHEDULES = "d1f062c14f74f758658b2703a5799002",
    FEST = "",
    GEAR = "",
}

export default class Splatnet3Manager {
    public static SplatNet3WebServiceId = 4834290508791808;
    public static baseUrl = "https://api.lp1.av5ja.srv.nintendo.net";
    public static webViewVersion = "4.0.0-d5178440";

    private logger = new Logger();

    private NsoManager: NsoManager;
    private bulletToken: BulletToken;
    private acceptLanguage: string;

    constructor(nsoClient: NsoManager, acceptLanguage?: string) {
        this.NsoManager = nsoClient;
        acceptLanguage ? this.acceptLanguage = acceptLanguage : this.acceptLanguage = "en-US";
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
        return new Cache<BulletTokenData>('bullettoken');
    }

    async start() {
        if (!!this.bulletToken) {
            this.bulletToken = await this.getBulletToken()
        }
    }

    async getBulletToken() {
        let tokenCache = this.getOrCreateBulletTokenCache();
        let bulletToken = (tokenCache.getData('bullettoken') as BulletTokenData).bullettoken;

        if (!bulletToken) {
            let webservicetoken = await this.NsoManager.getWebServiceToken(Splatnet3Manager.SplatNet3WebServiceId)
            bulletToken = await this.createBulletToken(tokenCache, webservicetoken)
        }

        return bulletToken;
    }

    async createBulletToken(cache: Cache<BulletTokenData>, webservicetoken: string) {
        this.logger.log();

        let request = await fetch(Splatnet3Manager.baseUrl + `/api/bullet_tokens`, {
            method: 'POST',
            headers: {
                "X-Web-View-Ver": Splatnet3Manager.webViewVersion,
                "X-NACOUNTRY": "US",
                "X-GameWebToken": webservicetoken,
                "Accept-Language": this.acceptLanguage,
            }
        })

        if (!request.ok) this.logger.log();

        let bullettoken = await request.json() as BulletToken;
        let expire = this.calculateExpire(7200);

        cache.setData({
            bullettoken,
            expire
        })

        this.logger.log();

        return bullettoken;
    }

    //GraphQl

    //TODO create or import type or variables and body and responses


    async GraphQlRequest(version: number, sha256Hash: string, variables: unknown = {}) {
        await this.start();

        let body: unknown = {
            extensions: { persistedQuery: { version, sha256Hash } },
            variables,
        }

        let graphQlRequest = await fetch(Splatnet3Manager.baseUrl + `/api/graphql`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.bulletToken.bulletToken}`,
                "X-Web-View-Ver": Splatnet3Manager.webViewVersion,
                "Content-Type": "application/json",
                "Accept-Language": this.acceptLanguage,
            },
            body: JSON.stringify(body)
        })

        if (!graphQlRequest.ok) this.logger.log();

        let response = await graphQlRequest.json();
        return response;
    }

    async getGraphQlQuery(query:QueryCodes) {
        //TODO add type Support for more Querry 
        return await this.GraphQlRequest(1, query) as GraphQLResponse<CoopResult | StageScheduleResult>;
    }
}