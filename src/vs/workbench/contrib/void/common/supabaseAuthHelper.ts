export class SupabaseAuthHelper {
	private static accessTokenCache: { token: string | null, timestamp: number } = {
		token: null,
		timestamp: 0
	};

	static setAccessToken(token: string | null) {
		this.accessTokenCache = {
			token,
			timestamp: Date.now()
		};
	}

	static getAccessTokenSync(): string | null {
		return this.accessTokenCache.token;
	}
}