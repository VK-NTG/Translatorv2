"""
Tests for the authentication module.
"""
import pytest


class TestAPIKeyAuthentication:
    """Tests for API key authentication."""

    def test_valid_api_key_allows_access(self, client, auth_headers):
        """Test that a valid API key allows access to protected endpoints."""
        response = client.get("/api/v1/misc/health", headers=auth_headers)
        assert response.status_code == 200

    def test_missing_api_key_returns_401(self, client):
        """Test that missing API key returns 401."""
        response = client.get("/api/v1/misc/health")
        assert response.status_code == 401

    def test_invalid_api_key_returns_401(self, client):
        """Test that invalid API key returns 401."""
        headers = {
            "x-api-key": "invalid-key",
            "Content-Type": "application/json",
        }
        response = client.get("/api/v1/misc/health", headers=headers)
        assert response.status_code == 401

    def test_empty_api_key_returns_401(self, client):
        """Test that empty API key returns 401."""
        headers = {
            "x-api-key": "",
            "Content-Type": "application/json",
        }
        response = client.get("/api/v1/misc/health", headers=headers)
        assert response.status_code == 401


class TestAdminAuthentication:
    """Tests for admin secret authentication."""

    def test_valid_admin_secret_allows_access(self, client, admin_headers):
        """Test that valid admin secret allows access to admin endpoints."""
        response = client.get(
            "/api/v1/context/system-settings",
            headers=admin_headers
        )
        # Should not be 401 or 403
        assert response.status_code not in [401, 403]

    def test_missing_admin_secret_returns_403(self, client, auth_headers):
        """Test that missing admin secret returns 403 for admin endpoints."""
        response = client.put(
            "/api/v1/context/system-settings",
            headers=auth_headers,
            json={"context_enhancement_enabled": True}
        )
        assert response.status_code == 403

    def test_invalid_admin_secret_returns_403(self, client, auth_headers):
        """Test that invalid admin secret returns 403."""
        headers = {**auth_headers, "x-admin-secret": "wrong-secret"}
        response = client.put(
            "/api/v1/context/system-settings",
            headers=headers,
            json={"context_enhancement_enabled": True}
        )
        assert response.status_code == 403


class TestPublicEndpoints:
    """Tests for endpoints that don't require authentication."""

    def test_swagger_docs_accessible_without_auth(self, client):
        """Test that API documentation is accessible without auth."""
        response = client.get("/api/docs")
        # Swagger redirects or returns HTML
        assert response.status_code in [200, 301, 302]

    def test_health_endpoint_requires_auth(self, client):
        """Test that health endpoint requires authentication."""
        response = client.get("/api/v1/misc/health")
        assert response.status_code == 401


class TestAuthErrorResponses:
    """Tests for authentication error response format."""

    def test_401_response_format(self, client):
        """Test that 401 response has correct format."""
        response = client.get("/api/v1/misc/health")
        data = response.get_json()

        assert response.status_code == 401
        assert "error" in data
        assert "Invalid or missing authentication" in data["error"]

    def test_403_response_format(self, client, auth_headers):
        """Test that 403 response has correct format."""
        response = client.put(
            "/api/v1/context/system-settings",
            headers=auth_headers,
            json={}
        )
        data = response.get_json()

        assert response.status_code == 403
        assert "error" in data
