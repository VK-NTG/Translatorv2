"""
Standardized error handling utilities for KK-AI-Translator.

Provides custom exception classes and decorators for consistent
error handling across the application.
"""
import logging
import traceback
from functools import wraps
from typing import Callable, Any, Type

from flask import jsonify

logger = logging.getLogger(__name__)


# ============================================================================
# Custom Exception Classes
# ============================================================================

class TranslatorError(Exception):
    """
    Base exception for all translator errors.

    Subclasses should define:
    - status_code: HTTP status code to return
    - error_code: Machine-readable error identifier
    """
    status_code = 500
    error_code = "INTERNAL_ERROR"

    def __init__(self, message: str, details: dict = None):
        """
        Initialize the error.

        Args:
            message: Human-readable error message
            details: Optional dictionary with additional error context
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> dict:
        """Convert error to dictionary for JSON response."""
        result = {
            "error": self.message,
            "error_code": self.error_code,
        }
        if self.details:
            result["details"] = self.details
        return result


class ValidationError(TranslatorError):
    """Raised when input validation fails."""
    status_code = 400
    error_code = "VALIDATION_ERROR"


class NotFoundError(TranslatorError):
    """Raised when a requested resource is not found."""
    status_code = 404
    error_code = "NOT_FOUND"


class AuthenticationError(TranslatorError):
    """Raised when authentication fails."""
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(TranslatorError):
    """Raised when user lacks permission for an operation."""
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"


class RateLimitError(TranslatorError):
    """Raised when rate limit is exceeded."""
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"


class ExternalServiceError(TranslatorError):
    """Raised when an external service (Azure, Promte) fails."""
    status_code = 502
    error_code = "EXTERNAL_SERVICE_ERROR"


class TranscriptionError(ExternalServiceError):
    """Raised when audio transcription fails."""
    error_code = "TRANSCRIPTION_ERROR"


class TranslationError(ExternalServiceError):
    """Raised when text translation fails."""
    error_code = "TRANSLATION_ERROR"


class TTSError(ExternalServiceError):
    """Raised when text-to-speech synthesis fails."""
    error_code = "TTS_ERROR"


class DatabaseError(TranslatorError):
    """Raised when a database operation fails."""
    status_code = 500
    error_code = "DATABASE_ERROR"


class ConfigurationError(TranslatorError):
    """Raised when there's a configuration problem."""
    status_code = 500
    error_code = "CONFIGURATION_ERROR"


# ============================================================================
# Error Handling Decorator
# ============================================================================

def handle_errors(
    error_map: dict[Type[Exception], tuple[int, str]] = None,
    default_message: str = "An unexpected error occurred",
    log_exceptions: bool = True
) -> Callable:
    """
    Decorator for standardized error handling in route functions.

    This decorator catches exceptions and converts them to appropriate
    HTTP responses with consistent JSON structure.

    Usage:
        @app.route('/translate')
        @handle_errors({ValueError: (400, "Invalid input")})
        def translate():
            ...

    Args:
        error_map: Dictionary mapping exception types to (status_code, message) tuples
        default_message: Message to use for unhandled exceptions
        log_exceptions: Whether to log exceptions (default True)

    Returns:
        Decorator function
    """
    error_map = error_map or {}

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)

            except TranslatorError as e:
                # Our custom exceptions - log and return structured response
                if log_exceptions:
                    logger.error(
                        "%s in %s: %s",
                        e.error_code, func.__name__, e.message,
                        extra={"details": e.details}
                    )
                return e.to_dict(), e.status_code

            except Exception as e:
                # Check if this exception type is in our error_map
                if error_map and type(e) in error_map:
                    status_code, message = error_map[type(e)]
                    if log_exceptions:
                        logger.warning(
                            "Handled %s in %s: %s",
                            type(e).__name__, func.__name__, str(e)
                        )
                    return {
                        "error": message,
                        "details": str(e)
                    }, status_code

                # Unhandled exceptions - log full traceback and return generic error
                if log_exceptions:
                    logger.exception(
                        "Unhandled exception in %s: %s",
                        func.__name__, str(e)
                    )
                return {
                    "error": default_message,
                    "error_code": "INTERNAL_ERROR"
                }, 500

        return wrapper
    return decorator


# ============================================================================
# Helper Functions
# ============================================================================

def log_and_raise(
    exception_class: Type[TranslatorError],
    message: str,
    details: dict = None,
    original_exception: Exception = None
) -> None:
    """
    Log an error and raise a standardized exception.

    Args:
        exception_class: The TranslatorError subclass to raise
        message: Error message
        details: Optional additional details
        original_exception: Original exception to chain

    Raises:
        The specified exception_class
    """
    logger.error(
        "%s: %s (details: %s, original: %s)",
        exception_class.__name__, message, details, original_exception
    )
    if original_exception:
        raise exception_class(message, details) from original_exception
    raise exception_class(message, details)


def register_error_handlers(app) -> None:
    """
    Register global error handlers with the Flask app.

    Call this during app initialization:
        register_error_handlers(app)

    Args:
        app: Flask application instance
    """
    @app.errorhandler(TranslatorError)
    def handle_translator_error(error: TranslatorError):
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "error": "Resource not found",
            "error_code": "NOT_FOUND"
        }), 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.exception("Internal server error: %s", error)
        return jsonify({
            "error": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }), 500
