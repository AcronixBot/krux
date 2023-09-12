import Logger from './util/Logger.js';

(() => {
    Logger.error("test", "Sub Module Error")
    Logger.warn("test", "Sub Module Warn")
    Logger.info("test", "Sub Module Info")
    Logger.debug("test", "Sub Module Debug")

    let query = "0f8c33970a425683bb1bdecca50a0ca4fb3c3641c0b2a1237aedfde9c0cb2b8f"

    Logger.info(`Starting the Data Update`, `DataUpdater (${query.substring(0, 8)})`);
})();