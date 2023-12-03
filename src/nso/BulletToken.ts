interface IBulletToken {
    bulletToken: string;
    lang: string;
    is_noe_country: "true" | "false";
}

interface BulletTokenData {
    expire: number;
    bullettoken: IBulletToken;
}

export default class BulletToken {
    #BulletToken: BulletTokenData
    #Cache;

    /**
     * Checks the cache. If the token in the cache expired, use the refresh token function to create new one, checks again the cache and if now token there do it again
     */
    public getBulletToken(): BulletTokenData {

    }

    /**
     * Uses createBulletToken() to create a new BulletToken, sets its in the cache calculates the expire
     * Bevor a new one will be created he checks again #Cache for an exsisting token and his expire
     */
    private refreshBulletToken(): BulletTokenData {

    }

    private calculateExpire(expires: number): number {
        let expire = Date.now() + expires * 1000;
        return expire - 5 * 60 * 1000;
    }

    /**
     * The raw function that creates the bullet token and returns just the result
     * So it makes a request to the servers, calculatest the response and if ok returns the IBulletToken
     */
    private createBulletToken(): IBulletToken {

    }
}