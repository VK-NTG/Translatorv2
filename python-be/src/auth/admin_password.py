import logging
from functools import wraps
from flask import request, abort
from .rate_limit import too_many_failures, note_failure
from urllib.parse import unquote_plus
from config.secrets import get_admin_secret

logger = logging.getLogger(__name__)


def require_admin_secret(fn):
    """
    Decorator that requires a valid admin secret in the x-admin-secret header.
    Implements rate limiting for failed attempts.
    """
    @wraps(fn)
    def wrapped(*args, **kwargs):
        client = unquote_plus(request.headers.get("x-admin-secret", ""))

        if client != get_admin_secret():
            too_many_failures()
            note_failure()
            logger.warning("Invalid admin secret attempt from %s", request.remote_addr)
            abort(401, "invalid or missing admin secret")
        return fn(*args, **kwargs)

    return wrapped
