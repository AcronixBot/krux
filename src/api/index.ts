import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import Cache from "../util/Cache.js";
const { urlencoded, json } = bodyParser;

export default class Api {
    private cache: Cache<unknown>;

    constructor() {

    }

    /**
     * name
     */
    public name() {
        const api = express();

        api.get(`/data/:route`, (req, res) => {
            let route = req.params.route;
            if (this.cache.checkEntry(route) === false) res.sendStatus(404);
            else {
                return res.send(this.cache.getData(route)).status(200)
            }
        })
    }
}