"""
Centralized secrets management for KK-AI-Translator.

All secrets MUST be provided via environment variables.
No default values are allowed for security-critical secrets.
The application will fail to start if required secrets are missing.
"""
import os
import logging

logger = logging.getLogger(__name__)


class SecretNotConfiguredError(Exception):
    """Raised when a required secret is not configured in environment variables."""
    pass


def get_required_secret(key: str, description: str = None) -> str:
    """
    Get a required secret from environment variables.

    Args:
        key: The environment variable name
        description: Human-readable description of what the secret is for

    Returns:
        The secret value

    Raises:
        SecretNotConfiguredError: If the secret is not set or empty
    """
    value = os.getenv(key)
    if not value or value.strip() == "":
        desc = description or key
        msg = f"Required secret '{key}' ({desc}) is not configured. Set the {key} environment variable."
        logger.critical(msg)
        raise SecretNotConfiguredError(msg)
    return value


def get_optional_secret(key: str, default: str = None) -> str:
    """
    Get an optional secret with a default value.

    Args:
        key: The environment variable name
        default: Default value if not set

    Returns:
        The secret value or default
    """
    return os.getenv(key, default)


def validate_required_secrets() -> None:
    """
    Validate that all required secrets are present at startup.
    Call this during application initialization to fail fast.

    Raises:
        SecretNotConfiguredError: If any required secrets are missing
    """
    required_secrets = [
        ("API_KEY", "API authentication key for client requests"),
        ("ADMIN_SECRET", "Admin authentication secret for privileged operations"),
    ]

    missing = []
    for key, description in required_secrets:
        value = os.getenv(key)
        if not value or value.strip() == "":
            missing.append(f"  - {key}: {description}")

    if missing:
        msg = "Missing required secrets:\n" + "\n".join(missing)
        msg += "\n\nPlease set these environment variables before starting the application."
        logger.critical(msg)
        raise SecretNotConfiguredError(msg)

    logger.info("All required secrets validated successfully")


# Lazy-loaded secrets (validated on first access)
_api_key = None
_admin_secret = None


def get_api_key() -> str:
    """
    Get the API key for client authentication.
    Cached after first retrieval.

    Returns:
        The API key

    Raises:
        SecretNotConfiguredError: If API_KEY is not configured
    """
    global _api_key
    if _api_key is None:
        _api_key = get_required_secret("API_KEY", "API authentication key")
    return _api_key


def get_admin_secret() -> str:
    """
    Get the admin secret for privileged operations.
    Cached after first retrieval.

    Returns:
        The admin secret

    Raises:
        SecretNotConfiguredError: If ADMIN_SECRET is not configured
    """
    global _admin_secret
    if _admin_secret is None:
        _admin_secret = get_required_secret("ADMIN_SECRET", "Admin authentication secret")
    return _admin_secret


def clear_cached_secrets() -> None:
    """
    Clear cached secrets. Useful for testing.
    """
    global _api_key, _admin_secret
    _api_key = None
    _admin_secret = None
