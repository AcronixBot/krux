import * as fs from "fs/promises";
import * as path from "path";
import * as mkdirp from "mkdirp";
import Util from "./Util.js";
import Logger from "./Logger.js";
const fetch = (...args: any[]) =>
  import("node-fetch").then(({ default: FetchFunction }) =>
    /** @ts-ignore */
    FetchFunction(...args)
  );

export default class ImageProcessor {
  destinationDirectory = "splatnet";
  outputDirectory = "images";
  siteURL: string;

  constructor() {
    this.siteURL = process.env.URL;
  }

  async process(url: string) {
    let destination = this.normalize(url);

    await this.maybeDownload(url, destination);

    return [destination, this.publicUrl(destination)];
  }

  normalize(url: string | URL) {
    return Util.normalizeSplatnetResourcePath(url);
  }

  localPath(file: string) {
    return `${this.destinationDirectory}/${this.outputDirectory}/${file}`;
  }

  publicUrl(file: string) {
    return `${this.siteURL || ""}/${this.outputDirectory}/${file}`;
  }

  async exists(file: string) {
    try {
      await fs.access(this.localPath(file));
      return true;
    } catch (e) {
      return false;
    }
  }
  async maybeDownload(url: string, destination: string) {
    if (await this.exists(destination)) {
      return;
    }
    return await this.download(url, destination);
  }

  async download(url: string, destination: string) {
    Logger.info(`Downloading image: ${destination}`, "ImageUpdater");

    try {
      let result = await fetch(url);

      await mkdirp.mkdirp(path.dirname(this.localPath(destination)));
      await fs.writeFile(this.localPath(destination), result.body);
    } catch (e) {
      Logger.error(
        `Image download failed for: ${destination} because ${e}`,
        "ImageUpdater"
      );
    }
  }
}
