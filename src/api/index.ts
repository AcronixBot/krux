import express, { Express } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import Cache from "../util/Cache.js";

import { rateLimit as rateLimitHandler } from "express-rate-limit";
import slowdown from "express-slow-down";

const { urlencoded, json } = bodyParser;

interface ApiOptions {
    port: number,
    key: string,
    dataSlowdown: number,
    rateLimit: number,
    allowIPList: string[]
}

export default class Api {
    private cache: Cache<unknown>;
    private port: number;
    private key: string;
    private dataSlowdown: number;
    private rateLimit: number;
    private allowIPList: string[];

    constructor(config: ApiOptions) {
        this.port = config.port;
        this.key = config.key;
        this.dataSlowdown = config.dataSlowdown;
        this.rateLimit = config.rateLimit;
        this.allowIPList = config.allowIPList;
    }



    private create() {
        let server = express();

        server.enable('trust proxy');
        server.set('trust proxy', 1);

        const dataSlowdown = slowdown({
            windowMs: this.dataSlowdown,
            delayAfter: 5,
            delayMs: 500,
        })

        const rateLimit = rateLimitHandler({
            windowMs: this.rateLimit,
            max: 5,
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req, res) => this.allowIPList.includes(req.ip),
        })

        server.use(cookieParser());
        server.use(express.json());
        server.use(express.urlencoded({ extended: true }));
        server.use(urlencoded({ extended: true }));
        server.use(json());
        server.use(cookieParser(this.key));

        return { server, dataSlowdown, rateLimit }
    }

    public start() {
        const api = this.create();

        api.server.get('/', (req, res) => {
            res.sendStatus(200);
        })

        this.protecteDataRoute(api.server);

        api.server.listen(this.port);
    }

    private protecteDataRoute(server: Express) {

        server.get(`/data/:route`, (req, res) => {
            let route = req.params.route;
            if (this.cache.checkEntry(route) === false) res.sendStatus(404);
            else {
                return res.send(this.cache.getData(route)).status(200)
            }
        })
    }
}