"""
Integration tests for context management API routes.
"""
import pytest


class TestSystemSettings:
    """Tests for system settings endpoints."""

    def test_get_system_settings(self, client, admin_headers):
        """Test getting system settings."""
        response = client.get(
            "/api/v1/context/system-settings",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        # Should return a dictionary of settings
        assert isinstance(data, dict)

    def test_update_system_settings_requires_admin(self, client, auth_headers):
        """Test that updating settings requires admin authentication."""
        response = client.put(
            "/api/v1/context/system-settings",
            headers=auth_headers,
            json={"context_enhancement_enabled": True}
        )

        assert response.status_code == 403

    def test_update_system_settings_with_admin(self, client, admin_headers):
        """Test updating settings with admin authentication."""
        response = client.put(
            "/api/v1/context/system-settings",
            headers=admin_headers,
            json={"context_enhancement_enabled": True}
        )

        assert response.status_code == 200

    def test_update_translation_prompt_mode(self, client, admin_headers):
        """Test updating translation prompt mode."""
        response = client.put(
            "/api/v1/context/system-settings",
            headers=admin_headers,
            json={
                "translation_prompt_mode": "extended",
                "translation_prompt_additions": "Be extra polite"
            }
        )

        assert response.status_code == 200

        # Verify the update
        get_response = client.get(
            "/api/v1/context/system-settings",
            headers=admin_headers
        )
        data = get_response.get_json()
        assert data.get("translation_prompt_mode") == "extended"


class TestLanguageContexts:
    """Tests for language context endpoints."""

    def test_get_language_contexts_list(self, client, admin_headers):
        """Test getting list of language contexts."""
        response = client.get(
            "/api/v1/context/language-contexts",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_create_language_context(self, client, admin_headers):
        """Test creating a new language context."""
        response = client.post(
            "/api/v1/context/language-contexts",
            headers=admin_headers,
            json={
                "language_code": "test-lang",
                "language_name": "Test Language",
                "formality_notes": "Use formal address",
                "cultural_notes": "Important cultural notes"
            }
        )

        assert response.status_code in [200, 201]
        data = response.get_json()
        assert data.get("language_code") == "test-lang"

    def test_get_language_context_by_code(self, client, admin_headers):
        """Test getting a specific language context."""
        # First create one
        client.post(
            "/api/v1/context/language-contexts",
            headers=admin_headers,
            json={
                "language_code": "get-test",
                "language_name": "Get Test Language"
            }
        )

        # Then retrieve it
        response = client.get(
            "/api/v1/context/language-contexts/get-test",
            headers=admin_headers
        )

        assert response.status_code == 200


class TestWordDefinitions:
    """Tests for word definition endpoints."""

    def test_get_word_definitions_list(self, client, admin_headers):
        """Test getting list of word definitions."""
        response = client.get(
            "/api/v1/context/word-definitions",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_create_word_definition(self, client, admin_headers):
        """Test creating a new word definition."""
        response = client.post(
            "/api/v1/context/word-definitions",
            headers=admin_headers,
            json={
                "word": "kommune",
                "language_code": "da",
                "definition": "Municipality - local government unit",
                "translation_hints": "Context-dependent translation",
                "priority": 10
            }
        )

        assert response.status_code in [200, 201]
        data = response.get_json()
        assert data.get("word") == "kommune"

    def test_search_word_definitions(self, client, admin_headers):
        """Test searching word definitions."""
        # First create a word
        client.post(
            "/api/v1/context/word-definitions",
            headers=admin_headers,
            json={
                "word": "searchable",
                "language_code": "da",
                "definition": "A searchable word"
            }
        )

        # Search for it
        response = client.get(
            "/api/v1/context/word-definitions?search=searchable",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_update_word_definition(self, client, admin_headers):
        """Test updating a word definition."""
        # First create a word
        create_response = client.post(
            "/api/v1/context/word-definitions",
            headers=admin_headers,
            json={
                "word": "updatable",
                "language_code": "da",
                "definition": "Original definition"
            }
        )
        word_id = create_response.get_json().get("id")

        # Update it
        response = client.put(
            f"/api/v1/context/word-definitions/{word_id}",
            headers=admin_headers,
            json={
                "definition": "Updated definition"
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data.get("definition") == "Updated definition"

    def test_delete_word_definition(self, client, admin_headers):
        """Test deleting a word definition."""
        # First create a word
        create_response = client.post(
            "/api/v1/context/word-definitions",
            headers=admin_headers,
            json={
                "word": "deletable",
                "language_code": "da",
                "definition": "To be deleted"
            }
        )
        word_id = create_response.get_json().get("id")

        # Delete it
        response = client.delete(
            f"/api/v1/context/word-definitions/{word_id}",
            headers=admin_headers
        )

        assert response.status_code == 200


class TestTranslationContext:
    """Tests for translation context retrieval."""

    def test_get_translation_context(self, client, admin_headers):
        """Test getting translation context for a language pair."""
        response = client.get(
            "/api/v1/context/translation-context?from_language=da&to_language=ar",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "system_settings" in data
