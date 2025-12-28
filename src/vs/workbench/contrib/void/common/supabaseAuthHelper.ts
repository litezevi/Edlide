export class SupabaseAuthHelper {
	private static accessTokenCache: { token: string | null, timestamp: number } = {
		token: null,
		timestamp: 0
	};

	private static readonly CACHE_DURATION = 10000; // 10 seconds

	static setAccessToken(token: string | null) {
		this.accessTokenCache = {
			token,
			timestamp: Date.now()
		};
	}

	static getAccessTokenSync(): string | null {
		const { token, timestamp } = this.accessTokenCache;

		// Invalid if older than 10 seconds
		if (token && Date.now() - timestamp < this.CACHE_DURATION) {
			return token;
		}

		return null;
	}
}