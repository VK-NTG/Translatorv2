"""
Authentication API Routes

Simple token endpoint for admin authentication.
"""

import logging
from flask import request
from flask_restx import Namespace, Resource, fields
from config.secrets import get_admin_secret, get_api_key

logger = logging.getLogger(__name__)

# Create namespace
api = Namespace('auth', description='Authentication operations')

# API Models
token_request = api.model('TokenRequest', {
    'admin_secret': fields.String(required=True, description='Admin secret for authentication')
})

token_response = api.model('TokenResponse', {
    'token': fields.String(description='Authentication token'),
    'expires_in': fields.Integer(description='Token expiration time in seconds')
})


@api.route('/token')
class TokenEndpoint(Resource):
    @api.doc('get_auth_token')
    @api.expect(token_request)
    @api.marshal_with(token_response)
    def post(self):
        """Get authentication token using admin secret"""
        data = request.get_json()

        if not data or 'admin_secret' not in data:
            return {'error': 'admin_secret is required'}, 400

        provided_secret = data['admin_secret']

        if provided_secret != get_admin_secret():
            logger.warning("Invalid admin secret in token request from %s", request.remote_addr)
            return {'error': 'Invalid admin secret'}, 401

        # For simplicity, return the API key as token
        # In production, this could be a proper JWT
        logger.info("Token issued to %s", request.remote_addr)

        return {
            'token': get_api_key(),
            'expires_in': 86400  # 24 hours
        }
