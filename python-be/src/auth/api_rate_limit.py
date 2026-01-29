"""
General API rate limiting for KK-AI-Translator.

Provides rate limiting decorators for protecting API endpoints
from abuse and ensuring fair resource usage.
"""
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps
from typing import Callable, Optional

from flask import request, abort, g

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.

    Note: This implementation stores state in memory, which means:
    - Rate limits reset on server restart
    - Doesn't work across multiple server instances

    For production with multiple instances, consider using Redis.
    """

    def __init__(self, max_requests: int = 100, window_seconds: int = 60, name: str = "default"):
        """
        Initialize the rate limiter.

        Args:
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Size of the sliding window in seconds
            name: Name for this limiter (used in logging)
        """
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.name = name
        self._requests: dict[str, list[datetime]] = defaultdict(list)

    def _get_client_key(self) -> str:
        """
        Get a unique identifier for the client.

        Uses API key if present (preferred), otherwise falls back to IP address.
        """
        # Prefer API key for identification (more reliable than IP)
        api_key = request.headers.get("x-api-key")
        if api_key:
            # Hash the API key to avoid storing it in plain text in logs
            return f"key:{api_key[:8]}..."

        # Fall back to IP address
        # Consider X-Forwarded-For for load balancer scenarios
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain (client IP)
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.remote_addr or "unknown"

        return f"ip:{client_ip}"

    def _cleanup(self, key: str) -> None:
        """Remove timestamps outside the current window."""
        now = datetime.utcnow()
        self._requests[key] = [
            t for t in self._requests[key]
            if now - t < self.window
        ]

    def is_limited(self) -> bool:
        """Check if the client has exceeded the rate limit."""
        key = self._get_client_key()
        self._cleanup(key)
        return len(self._requests[key]) >= self.max_requests

    def record_request(self) -> None:
        """Record a request from the client."""
        key = self._get_client_key()
        self._requests[key].append(datetime.utcnow())

    def remaining(self) -> int:
        """Get the number of remaining requests in the current window."""
        key = self._get_client_key()
        self._cleanup(key)
        return max(0, self.max_requests - len(self._requests[key]))

    def reset_time(self) -> Optional[datetime]:
        """Get the time when the rate limit will reset (oldest request expiry)."""
        key = self._get_client_key()
        self._cleanup(key)
        if self._requests[key]:
            oldest = min(self._requests[key])
            return oldest + self.window
        return None


# Pre-configured limiters for different endpoints
default_limiter = RateLimiter(
    max_requests=100,
    window_seconds=60,
    name="default"
)

translation_limiter = RateLimiter(
    max_requests=200,
    window_seconds=60,
    name="translation"
)

transcription_limiter = RateLimiter(
    max_requests=20,
    window_seconds=60,
    name="transcription"
)

recap_limiter = RateLimiter(
    max_requests=10,
    window_seconds=60,
    name="recap"
)


def rate_limit(limiter: RateLimiter = None) -> Callable:
    """
    Decorator to apply rate limiting to a Flask route.

    Usage:
        @app.route('/translate')
        @rate_limit(translation_limiter)
        def translate():
            ...

    Args:
        limiter: The RateLimiter instance to use. Defaults to default_limiter.

    Returns:
        Decorator function
    """
    limiter = limiter or default_limiter

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if limiter.is_limited():
                client_key = limiter._get_client_key()
                reset_time = limiter.reset_time()
                logger.warning(
                    "Rate limit exceeded for %s on %s limiter. Reset at %s",
                    client_key, limiter.name, reset_time
                )
                abort(
                    429,
                    description=f"Rate limit exceeded. Please try again in {limiter.window.seconds} seconds."
                )

            limiter.record_request()

            # Add rate limit headers to response
            # Store in g for after_request handler
            g.rate_limit_remaining = limiter.remaining()
            g.rate_limit_limit = limiter.max_requests
            g.rate_limit_reset = limiter.reset_time()

            return func(*args, **kwargs)
        return wrapper
    return decorator


def add_rate_limit_headers(app):
    """
    Register an after_request handler to add rate limit headers.

    Call this during app initialization:
        add_rate_limit_headers(app)
    """
    @app.after_request
    def add_headers(response):
        if hasattr(g, 'rate_limit_remaining'):
            response.headers['X-RateLimit-Remaining'] = str(g.rate_limit_remaining)
        if hasattr(g, 'rate_limit_limit'):
            response.headers['X-RateLimit-Limit'] = str(g.rate_limit_limit)
        if hasattr(g, 'rate_limit_reset') and g.rate_limit_reset:
            response.headers['X-RateLimit-Reset'] = g.rate_limit_reset.isoformat()
        return response
