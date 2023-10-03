import dotenv from 'dotenv';
dotenv.config();

import Logger from './util/Logger.js';
import DynamicUpdater from './util/DynamicUpdater.js';
import NsoManager from './nso/Nso.js';
import Splatnet3Manager, { QueryCodes } from './nso/Splatnet.js';
import { locales } from './util/Util.js';


(() => {
    Logger.info('Server started', 'SERVER');

    const nsoManager = new NsoManager(process.env.SESSION_TOKEN, locales.enUS);
    const spaltnetManager = new Splatnet3Manager(nsoManager);
    const update = new DynamicUpdater(nsoManager, spaltnetManager, QueryCodes.COOP);

    update.update();
})();