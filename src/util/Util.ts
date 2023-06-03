import { createHash } from "crypto";

export default class Util {
    static normalizeSplatnetResourcePath(url: string | URL) {
        // Parse the URL
        let u = new URL(url);

        // Get just the pathname (without the host, query string, etc.)
        let result = u.pathname;

        // Remove "/resources/prod" from the beginning if it exists
        result = result.replace(/^\/resources\/prod/, "");

        // Remove the leading slash
        result = result.replace(/^\//, "");

        return result;
    }

    static deriveId(node: { image: { url: string | URL; }; }) {
        // Unfortunately, SplatNet doesn't return IDs for a lot of gear properties.
        // Derive IDs from image URLs instead.

        let path = this.normalizeSplatnetResourcePath(node.image.url);

        let hash = createHash("shake256", { outputLength: 8 });
        let id = hash.update(path).digest("hex");

        return {
            __voroniyx_id: id,
            ...node,
        };
    }    
}