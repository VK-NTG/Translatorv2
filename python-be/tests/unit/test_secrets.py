"""
Tests for the secrets configuration module.
"""
import os
import pytest


class TestSecretsModule:
    """Tests for config/secrets.py functionality."""

    def test_get_required_secret_returns_value(self, monkeypatch):
        """Test that get_required_secret returns the value when set."""
        monkeypatch.setenv("TEST_SECRET", "test-value-123")

        # Import after setting env var
        from config.secrets import get_required_secret

        result = get_required_secret("TEST_SECRET", "Test secret")
        assert result == "test-value-123"

    def test_get_required_secret_raises_when_missing(self, monkeypatch):
        """Test that get_required_secret raises SecretNotConfiguredError when missing."""
        monkeypatch.delenv("MISSING_SECRET", raising=False)

        from config.secrets import get_required_secret, SecretNotConfiguredError

        with pytest.raises(SecretNotConfiguredError) as exc_info:
            get_required_secret("MISSING_SECRET", "A missing secret")

        assert "MISSING_SECRET" in str(exc_info.value)

    def test_get_required_secret_raises_when_empty(self, monkeypatch):
        """Test that get_required_secret raises SecretNotConfiguredError for empty string."""
        monkeypatch.setenv("EMPTY_SECRET", "")

        from config.secrets import get_required_secret, SecretNotConfiguredError

        with pytest.raises(SecretNotConfiguredError):
            get_required_secret("EMPTY_SECRET", "An empty secret")

    def test_get_required_secret_raises_when_whitespace_only(self, monkeypatch):
        """Test that get_required_secret raises for whitespace-only value."""
        monkeypatch.setenv("WHITESPACE_SECRET", "   ")

        from config.secrets import get_required_secret, SecretNotConfiguredError

        with pytest.raises(SecretNotConfiguredError):
            get_required_secret("WHITESPACE_SECRET", "Whitespace secret")

    def test_get_api_key_caches_value(self, monkeypatch):
        """Test that get_api_key caches the value on first call."""
        monkeypatch.setenv("API_KEY", "cached-api-key")

        # Reset the cache
        import config.secrets
        config.secrets._api_key = None

        from config.secrets import get_api_key

        # First call should read from env
        result1 = get_api_key()
        # Second call should return cached value
        result2 = get_api_key()

        assert result1 == "cached-api-key"
        assert result2 == "cached-api-key"

    def test_get_admin_secret_caches_value(self, monkeypatch):
        """Test that get_admin_secret caches the value on first call."""
        monkeypatch.setenv("ADMIN_SECRET", "cached-admin-secret")

        # Reset the cache
        import config.secrets
        config.secrets._admin_secret = None

        from config.secrets import get_admin_secret

        result1 = get_admin_secret()
        result2 = get_admin_secret()

        assert result1 == "cached-admin-secret"
        assert result2 == "cached-admin-secret"
