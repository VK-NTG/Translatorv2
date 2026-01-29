"""
Integration tests for the translation session workflow.
"""
import pytest


class TestSessionWorkflow:
    """Tests for the complete translation session workflow."""

    def test_start_session_creates_new_session(self, client, auth_headers):
        """Test that starting a session creates a new session."""
        response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "session_id" in data
        assert data["session_id"] is not None

    def test_select_language_sets_languages(self, client, auth_headers):
        """Test that selecting language pair updates the session."""
        # First create a session
        start_response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )
        session_id = start_response.get_json()["session_id"]

        # Select languages
        response = client.post(
            "/api/v1/sessions/select-language",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "from_language": "da",
                "from_language_name": "Danish",
                "to_language": "ar",
                "to_language_name": "Arabic"
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data.get("from_language") == "da"
        assert data.get("to_language") == "ar"

    def test_translate_text_requires_session(self, client, auth_headers, mock_azure_translation):
        """Test that translation requires an active session."""
        # First create and configure a session
        start_response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )
        session_id = start_response.get_json()["session_id"]

        # Select languages
        client.post(
            "/api/v1/sessions/select-language",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "from_language": "da",
                "from_language_name": "Danish",
                "to_language": "ar",
                "to_language_name": "Arabic"
            }
        )

        # Perform translation
        response = client.post(
            "/api/v1/sessions/translate",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "text": "Hej, hvordan har du det?",
                "direction": "from_to"
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "translated_text" in data

    def test_translate_with_invalid_session_fails(self, client, auth_headers):
        """Test that translation with invalid session ID fails."""
        response = client.post(
            "/api/v1/sessions/translate",
            headers=auth_headers,
            json={
                "session_id": 99999,
                "text": "Hello",
                "direction": "from_to"
            }
        )

        assert response.status_code in [400, 404]

    def test_finish_session_ends_session(self, client, auth_headers):
        """Test that finishing a session marks it as completed."""
        # Create session
        start_response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )
        session_id = start_response.get_json()["session_id"]

        # Finish session
        response = client.post(
            "/api/v1/sessions/finish-session",
            headers=auth_headers,
            json={"session_id": session_id}
        )

        assert response.status_code == 200

    def test_cannot_translate_on_finished_session(self, client, auth_headers, mock_azure_translation):
        """Test that translation fails on a finished session."""
        # Create and finish session
        start_response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )
        session_id = start_response.get_json()["session_id"]

        # Select languages first
        client.post(
            "/api/v1/sessions/select-language",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "from_language": "da",
                "from_language_name": "Danish",
                "to_language": "en",
                "to_language_name": "English"
            }
        )

        client.post(
            "/api/v1/sessions/finish-session",
            headers=auth_headers,
            json={"session_id": session_id}
        )

        # Try to translate
        response = client.post(
            "/api/v1/sessions/translate",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "text": "Hello",
                "direction": "from_to"
            }
        )

        # Should fail because session is finished
        assert response.status_code in [400, 404]


class TestSessionRecap:
    """Tests for session recap functionality."""

    def test_recap_requires_session_id(self, client, auth_headers):
        """Test that recap requires a session ID."""
        response = client.get(
            "/api/v1/sessions/recap",
            headers=auth_headers
        )

        assert response.status_code in [400, 422]

    def test_recap_returns_summary(self, client, auth_headers, mock_azure_translation):
        """Test that recap returns a conversation summary."""
        # Create session
        start_response = client.post(
            "/api/v1/sessions/start-session",
            headers=auth_headers,
            json={}
        )
        session_id = start_response.get_json()["session_id"]

        # Select languages
        client.post(
            "/api/v1/sessions/select-language",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "from_language": "da",
                "from_language_name": "Danish",
                "to_language": "ar",
                "to_language_name": "Arabic"
            }
        )

        # Perform a translation
        client.post(
            "/api/v1/sessions/translate",
            headers=auth_headers,
            json={
                "session_id": session_id,
                "text": "Goddag",
                "direction": "from_to"
            }
        )

        # Get recap
        response = client.get(
            f"/api/v1/sessions/recap?session_id={session_id}",
            headers=auth_headers
        )

        assert response.status_code == 200


class TestMiscEndpoints:
    """Tests for miscellaneous API endpoints."""

    def test_health_check_returns_status(self, client, auth_headers):
        """Test that health check returns status."""
        response = client.get("/api/v1/misc/health", headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_ping_returns_pong(self, client, auth_headers):
        """Test that ping endpoint returns pong."""
        response = client.get("/api/v1/misc/ping", headers=auth_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data or "pong" in str(data).lower()
