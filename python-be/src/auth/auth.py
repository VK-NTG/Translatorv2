import os
import logging
from flask import request, make_response, jsonify

# from jose import jwt  # Disabled for now
from dotenv import load_dotenv
from config.secrets import get_api_key

load_dotenv()

logger = logging.getLogger(__name__)

# Azure AD config (for future JWT support)
TENANT_ID = os.getenv("TENANT_ID", "")
CLIENT_ID = os.getenv("CLIENT_ID", "")

JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
ISSUER = f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"

# cache JWKS keys
# _jwks_cache = None

# --- Future JWT support code (disabled) ---
# def get_jwks_keys():
#     global _jwks_cache
#     if _jwks_cache is None:
#         resp = requests.get(JWKS_URL)
#         resp.raise_for_status()
#         _jwks_cache = resp.json()
#     return _jwks_cache

# def validate_jwt_token(token):
#     keys = get_jwks_keys()
#     header = jwt.get_unverified_header(token)

#     key = next((k for k in keys["keys"] if k["kid"] == header["kid"]), None)
#     if not key:
#         raise Exception("Public key not found.")

#     payload = jwt.decode(
#         token,
#         key,
#         algorithms=["RS256"],
#         audience=CLIENT_ID,
#         issuer=ISSUER,
#     )
#     return payload
# -----------------------------------------


def register_auth_check(app):
    @app.before_request
    def verify_auth():
        # Auth disabled - running behind firewall
        # To re-enable, uncomment the code below
        return

        # logger.debug("verify_auth: method=%s, path=%s", request.method, request.path)
        # if request.method == "OPTIONS":
        #     return

        # # Skip auth for docs, static files, frontend routes, auth endpoints
        # if (
        #     request.path.startswith("/docs")
        #     or request.path.startswith("/swagger")
        #     or request.path.startswith("/openapi")
        #     or request.path.startswith("/static")
        #     or request.path.startswith("/api/v1/auth/")
        #     or not request.path.startswith("/api/")
        # ):
        #     return

        # # API key check (used instead of JWT for simplicity, behind firewall)
        # provided_key = request.headers.get("x-api-key")
        # if provided_key == get_api_key():
        #     logger.debug("Authenticated with API key")
        #     return

        # return make_response(
        #     jsonify({"error": "Invalid or missing authentication"}), 401
        # )
