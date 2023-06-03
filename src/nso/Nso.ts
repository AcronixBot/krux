//import CoralApi as named import for intellisense
import { addUserAgent, CoralApi } from "nxapi";
import Logger from "../util/Logger.js";
import Cache from "../util/Cache.js";
import { CoralAuthData } from "nxapi/dist/api/coral";
/** @ts-ignore */
// import CoralApi from "nxapi/coral";

interface CoralAuthSafeData {
    data: CoralAuthData,
    expires: number
}

interface WebservicetokenData {
    accessToken: string,
    expiresIn: number
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
    cacheName = 'nso'



    constructor(sessionToken: string, region: string) {
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
        return new Cache<CoralAuthSafeData>('coral');
    }

    async coralSession() {
        this.logger.log()

        let { data } = await CoralApi.createWithSessionToken(this.sessionToken);
        let expire = this.calculateExpire(data.credential.expiresIn);

        this.logger.log();

        this.getOrCreateCoralCache().setData({ data, expires: expire })

        return data;
    }

    async useCoralApi() {
        let data = (this.getOrCreateCoralCache().getData('coral') as CoralAuthSafeData).data;
        if (!data) data = await this.coralSession();
        return CoralApi.createWithSavedToken(data);
    }

    //Web Service Token
    getOrCreateTokenCache() {
        return new Cache<WebservicetokenData>(`webservicetoken`);
    }

    async useWebServiceToken(id: number, cache: Cache<WebservicetokenData>) {
        let coral = await this.useCoralApi();
        this.logger.log();

        let { accessToken, expiresIn } = await coral.getWebServiceToken(id)

        let expire = this.calculateExpire(expiresIn);
        this.logger.log();
        this.getOrCreateTokenCache().setData({ accessToken, expiresIn });

        return {
            accessToken, expiresIn
        }
    }

    async getWebServiceToken(id: number) {
        let cache = this.getOrCreateTokenCache();
        let accessToken = (cache.getData(`webservicetoken`) as WebservicetokenData).accessToken;
        if (!accessToken) accessToken = (await this.useWebServiceToken(id, cache)).accessToken;

        return accessToken;
    }
}