import Splatnet3Manager, { QueryCodes } from "../nso/Splatnet.js";
import NsoManager from "../nso/Nso.js";
import ImageManager from "./ImageManager.js";
import Logger from "./Logger.js";
import Util, { ILocal, locales } from './Util.js'
import jsonpath from 'jsonpath';
import { GraphQLResponse } from "splatnet3-types/dist/graphql";
import { CoopResult, StageScheduleResult } from "splatnet3-types/dist/splatnet3";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";


export default class DataUpdateManager {
    private ImageManager = new ImageManager();
    private logger = new Logger();
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

    async getData(locale:ILocal, query:QueryCodes) {
        return await this.splatnet3(locale.code).getGraphQlQuery(query);
    };

    async update() {
        this.logger.log();

        try {
            for(const key of Object.entries(QueryCodes)) {
                let data = await this.getData(this.Util.defaultLocale, key[1]);

                this.deriveIds(data)

                await this.downloadImages(data);

                await this.safeData(data);

                this.logger.log('Done')
            }
        } catch(e) {
            return this.logger.log();  
        }
    }

    deriveIds(data: GraphQLResponse<CoopResult | StageScheduleResult>) {
		for (let expression of this.derivedIds) {
			jsonpath.apply(data, expression, this.Util.deriveId);
		}
	}

    async downloadImages(data: GraphQLResponse<CoopResult | StageScheduleResult>) {
        const images = {};

        for(const expression of this.imagePaths) {
            let mapping = {};
            for(const url of jsonpath.query(data, expression)) {
                let [path, publicUrl] = await this.ImageManager.process(url);
                mapping[url] = publicUrl;
                images[publicUrl] = path;
            }

            jsonpath.apply(data, expression, (url:string | number) => mapping[url]);
        }

        return images;
    }

    async safeData(data: GraphQLResponse<CoopResult | StageScheduleResult>) {
        let s = JSON.stringify(data, undefined, 2);

        // TODO Safe data in cache
    }

}