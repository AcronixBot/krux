import dotenv from 'dotenv';
dotenv.config();

import BulletToken from "./nso/BulletToken.js";
import NsoManager from "./nso/Nso.js";
import Splatnet3Manager from "./nso/Splatnet.js";
import { locales } from "./util/Util.js";
import { addUserAgent } from "nxapi";
(async () => {
    addUserAgent(process.env.USERAGENT);

    const nsoManager = new NsoManager(process.env.SESSION_TOKEN, locales.enUS);
    const bulletTokenGen = new BulletToken((await nsoManager.createWebServiceToken(Splatnet3Manager.SplatNet3WebServiceId)).accessToken, locales.enUS)

    const testToken = await bulletTokenGen.getBulletToken();
    console.log(testToken);
})();