"""
Simple OAuth2 test client for testing the IDP.

First, you need to create the app:
e.g.:
curl -s -XPOST "https://api.chutes.ai/idp/apps" -H "Authorization: $CHUTES_API_KEY" -H "Content-Type: application/json" -d '{
   "name": "Test App",
   "description": "Test OAuth application",
   "redirect_uris": ["http://fakeapp.lvh.me:22221/callback"],
   "homepage_url": "http://fakeapp.lvh.me:22221",
   "allowed_scopes": ["openid", "profile", "chutes:invoke", "account:read", "billing:read"]
}' | jq .
{
  "app_id": "b4..",
  "client_id": "cid_mof..",
  "user_id": "dff..",
  "name": "Test App",
  "description": "Test OAuth application",
  "redirect_uris": [
    "http://fakeapp.lvh.me:22221/callback"
  ],
  "homepage_url": "http://fakeapp.lvh.me:22221",
  "logo_url": null,
  "active": true,
  "public": true,
  "refresh_token_lifetime_days": 30,
  "created_at": "2025-12-14T15:42:21.179800",
  "updated_at": "2025-12-14T15:42:21.179800",
  "client_secret": "csc_l..",
}

Then set the environment variables for CLIENT_ID and CLIENT_SECRET values from this output:
export CLIENT_ID=cid_m...
export CLIENT_SECRET=csc_l...

Run with: uvicorn test_oauth_client:app --host 0.0.0.0 --port 22221

Then visit: http://fakeapp.lvh.me:22221/login
"""

import base64
import hashlib
import os
import secrets
import aiohttp
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse

app = FastAPI()

# Configuration
IDP_BASE_URL = "https://idp.chutes.ai"
CLIENT_ID = os.environ["CLIENT_ID"]
CLIENT_SECRET = os.environ["CLIENT_SECRET"]
REDIRECT_URI = "http://fakeapp.lvh.me:22221/callback"
SCOPES = "openid profile chutes:invoke account:read billing:read"

# In-memory storage for PKCE verifiers (in production, use session storage)
pkce_store = {}


def generate_pkce():
    """Generate PKCE code_verifier and code_challenge."""
    code_verifier = secrets.token_urlsafe(32)
    sha256_hash = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


@app.get("/", response_class=HTMLResponse)
async def home():
    """Home page with login button."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth2 Test Client</title>
        <style>
            body {{ font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }}
            .btn {{ background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }}
            .btn:hover {{ background: #45a049; }}
        </style>
    </head>
    <body>
        <h1>OAuth2 Test Client</h1>
        <p>Click below to start the OAuth2 authorization flow:</p>
        <a class="btn" href="/login">Login with Chutes</a>
        <br><br>
        <p><small>Client ID: {CLIENT_ID}</small></p>
    </body>
    </html>
    """


@app.get("/login")
async def login():
    """Initiate OAuth2 flow with PKCE."""
    state = secrets.token_urlsafe(16)
    code_verifier, code_challenge = generate_pkce()

    # Store verifier for later (keyed by state)
    pkce_store[state] = code_verifier

    auth_url = (
        f"{IDP_BASE_URL}/idp/authorize"
        f"?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPES.replace(' ', '%20')}"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )

    return RedirectResponse(url=auth_url)


@app.get("/callback", response_class=HTMLResponse)
async def callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
):
    """Handle OAuth2 callback."""

    if error:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><title>OAuth2 Error</title></head>
        <body>
            <h1>Authorization Error</h1>
            <p><strong>Error:</strong> {error}</p>
            <p><strong>Description:</strong> {error_description or "N/A"}</p>
            <a href="/">Try again</a>
        </body>
        </html>
        """

    if not code:
        return "<h1>Error: No authorization code received</h1>"

    # Get the code_verifier for this state
    code_verifier = pkce_store.pop(state, None)

    # Exchange code for tokens
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    if code_verifier:
        token_data["code_verifier"] = code_verifier

    async with aiohttp.ClientSession() as client:
        token_response = await client.post(
            f"{IDP_BASE_URL}/idp/token",
            data=token_data,
        )

        token_result = await token_response.json()

        # If we got tokens, also fetch additional data
        userinfo_result = None
        me_result = None
        quota_result = None
        chat_result = None
        refresh_result = None
        introspect_result = None
        revoke_result = None
        post_revoke_me_result = None
        post_revoke_refresh_result = None

        if "access_token" in token_result:
            auth_headers = {"Authorization": f"Bearer {token_result['access_token']}"}

            # Fetch userinfo from IDP
            userinfo_response = await client.get(
                f"{IDP_BASE_URL}/idp/userinfo",
                headers=auth_headers,
            )
            if userinfo_response.status == 200:
                userinfo_result = await userinfo_response.json()

            # Fetch /users/me
            me_response = await client.get(
                f"{IDP_BASE_URL}/users/me",
                headers=auth_headers,
            )
            if me_response.status == 200:
                me_result = await me_response.json()
            else:
                me_result = {"error": me_response.status, "body": await me_response.text()}

            # Fetch quota usage
            quota_response = await client.get(
                f"{IDP_BASE_URL}/users/me/quota_usage/default",
                headers=auth_headers,
            )
            if quota_response.status == 200:
                quota_result = await quota_response.json()
            else:
                quota_result = {"error": quota_response.status, "body": await quota_response.text()}

            # Call chat completions API with Host header override
            chat_headers = {
                "Authorization": f"Bearer {token_result['access_token']}",
                "Host": "llm.chutes.ai",
                "Content-Type": "application/json",
            }
            chat_payload = {
                "model": "Qwen/Qwen3-32B",
                "messages": [{"role": "user", "content": "What is the word, bird?"}],
                "stream": False,
                "max_tokens": 10,
            }
            chat_response = await client.post(
                f"{IDP_BASE_URL}/v1/chat/completions",
                headers=chat_headers,
                json=chat_payload,
            )
            if chat_response.status == 200:
                chat_result = await chat_response.json()
            else:
                chat_result = {"error": chat_response.status, "body": await chat_response.text()}

            # Test token refresh
            if "refresh_token" in token_result:
                refresh_data = {
                    "grant_type": "refresh_token",
                    "refresh_token": token_result["refresh_token"],
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                }
                refresh_response = await client.post(
                    f"{IDP_BASE_URL}/idp/token",
                    data=refresh_data,
                )
                refresh_result = await refresh_response.json()

            # Test token introspection
            introspect_data = {
                "token": token_result["access_token"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            }
            introspect_response = await client.post(
                f"{IDP_BASE_URL}/idp/token/introspect",
                data=introspect_data,
            )
            introspect_result = await introspect_response.json()

            # Revoke app authorization using CHUTES_API_KEY
            chutes_api_key = os.environ.get("CHUTES_API_KEY")
            if chutes_api_key:
                revoke_headers = {"Authorization": chutes_api_key}

                # First, list authorized apps to find the app_id
                auth_list_response = await client.get(
                    f"{IDP_BASE_URL}/idp/authorizations",
                    headers=revoke_headers,
                )
                if auth_list_response.status == 200:
                    auth_list = await auth_list_response.json()
                    # Get the first (most recent) authorized app - in test scenario there's only one
                    items = auth_list.get("items", [])
                    app_id = items[0].get("app_id") if items else None

                    if app_id:
                        revoke_response = await client.delete(
                            f"{IDP_BASE_URL}/idp/authorizations/{app_id}",
                            headers=revoke_headers,
                        )
                        if revoke_response.status == 200:
                            revoke_result = await revoke_response.json()
                        else:
                            revoke_result = {
                                "error": revoke_response.status,
                                "body": await revoke_response.text(),
                            }

                        # Try to use the access token after revocation - should fail
                        post_revoke_response = await client.get(
                            f"{IDP_BASE_URL}/users/me",
                            headers=auth_headers,
                        )
                        if post_revoke_response.status == 200:
                            post_revoke_me_result = {
                                "error": "Token still works after revocation!",
                                "data": await post_revoke_response.json(),
                            }
                        else:
                            post_revoke_me_result = {
                                "success": True,
                                "status": post_revoke_response.status,
                                "message": "Access token correctly rejected after revocation",
                            }

                        # Try to use the refresh token after revocation - should also fail
                        if "refresh_token" in token_result:
                            post_revoke_refresh_data = {
                                "grant_type": "refresh_token",
                                "refresh_token": token_result["refresh_token"],
                                "client_id": CLIENT_ID,
                                "client_secret": CLIENT_SECRET,
                            }
                            post_revoke_refresh_response = await client.post(
                                f"{IDP_BASE_URL}/idp/token",
                                data=post_revoke_refresh_data,
                            )
                            if post_revoke_refresh_response.status == 200:
                                post_revoke_refresh_result = {
                                    "error": "Refresh token still works after revocation!",
                                    "data": await post_revoke_refresh_response.json(),
                                }
                            else:
                                post_revoke_refresh_result = {
                                    "success": True,
                                    "status": post_revoke_refresh_response.status,
                                    "message": "Refresh token correctly rejected after revocation",
                                }
                    else:
                        revoke_result = {
                            "error": "Could not find app_id for CLIENT_ID in authorized apps",
                            "apps": auth_list,
                        }
                else:
                    revoke_result = {
                        "error": auth_list_response.status,
                        "body": await auth_list_response.text(),
                    }
            else:
                revoke_result = {"skipped": True, "reason": "CHUTES_API_KEY not set in environment"}

    # Mask sensitive tokens for display
    display_token_result = token_result.copy()
    if "access_token" in display_token_result:
        display_token_result["access_token"] = mask_token(display_token_result["access_token"])
    if "refresh_token" in display_token_result:
        display_token_result["refresh_token"] = mask_token(display_token_result["refresh_token"])

    display_refresh_result = None
    if refresh_result:
        display_refresh_result = refresh_result.copy()
        if "access_token" in display_refresh_result:
            display_refresh_result["access_token"] = mask_token(
                display_refresh_result["access_token"]
            )
        if "refresh_token" in display_refresh_result:
            display_refresh_result["refresh_token"] = mask_token(
                display_refresh_result["refresh_token"]
            )

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth2 Success</title>
        <style>
            body {{ font-family: sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }}
            pre {{ background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }}
            .section {{ margin: 20px 0; }}
            h2 {{ color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }}
            .success {{ color: #4CAF50; }}
            .error {{ color: #f44336; }}
        </style>
    </head>
    <body>
        <h1 class="{"success" if "access_token" in token_result else "error"}">
            {
        "Authorization Successful!" if "access_token" in token_result else "Token Exchange Failed"
    }
        </h1>

        <div class="section">
            <h2>Authorization Code</h2>
            <pre>{code}</pre>
        </div>

        <div class="section">
            <h2>State</h2>
            <pre>{state}</pre>
        </div>

        <div class="section">
            <h2>Token Response (HTTP {token_response.status})</h2>
            <pre>{format_json(display_token_result)}</pre>
        </div>

        {
        f'''
        <div class="section">
            <h2>UserInfo Response (/idp/userinfo)</h2>
            <pre>{format_json(userinfo_result)}</pre>
        </div>
        '''
        if userinfo_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>User Profile (/users/me)</h2>
            <pre>{format_json(me_result)}</pre>
        </div>
        '''
        if me_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Quota Usage (/users/me/quota_usage/default)</h2>
            <pre>{format_json(quota_result)}</pre>
        </div>
        '''
        if quota_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Chat Completion (/v1/chat/completions)</h2>
            <pre>{format_json(chat_result)}</pre>
        </div>
        '''
        if chat_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Token Refresh Test (/idp/token)</h2>
            <pre>{format_json(display_refresh_result)}</pre>
        </div>
        '''
        if display_refresh_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Token Introspection (/idp/token/introspect)</h2>
            <pre>{format_json(introspect_result)}</pre>
        </div>
        '''
        if introspect_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Revoke Authorization (DELETE /idp/authorizations/&lt;app_id&gt;)</h2>
            <pre>{format_json(revoke_result)}</pre>
        </div>
        '''
        if revoke_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Post-Revoke Access Token Test (/users/me)</h2>
            <pre>{format_json(post_revoke_me_result)}</pre>
        </div>
        '''
        if post_revoke_me_result
        else ""
    }

        {
        f'''
        <div class="section">
            <h2>Post-Revoke Refresh Token Test (/idp/token)</h2>
            <pre>{format_json(post_revoke_refresh_result)}</pre>
        </div>
        '''
        if post_revoke_refresh_result
        else ""
    }

        <div class="section">
            <a href="/">Start Over</a>
        </div>
    </body>
    </html>
    """


def format_json(obj):
    """Format JSON for display."""
    import json

    if obj is None:
        return "null"
    return json.dumps(obj, indent=2)


def mask_token(token: str) -> str:
    """Mask a token to show only prefix and suffix."""
    if not token or len(token) < 20:
        return token
    return f"{token[:12]}...{token[-4:]}"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=22221)
