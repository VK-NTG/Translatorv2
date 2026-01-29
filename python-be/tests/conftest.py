"""
Pytest configuration and fixtures for KK-AI-Translator tests.
"""
import os
import sys
import pytest

# Set test environment variables before importing the app
os.environ["API_KEY"] = "test-api-key"
os.environ["ADMIN_SECRET"] = "test-admin-secret"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["AZURE_OPENAI_KEY"] = "test-azure-key"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://test.openai.azure.com/"
os.environ["AZURE_SPEECH_KEY"] = "test-speech-key"
os.environ["AZURE_SPEECH_REGION"] = "westeurope"
os.environ["PROMTE_API_KEY"] = "test-promte-key"

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


@pytest.fixture
def app():
    """Create and configure a test Flask application instance."""
    # Import Flask and db before importing app
    from flask import Flask
    from db.sql import db

    # Create a fresh Flask app for testing
    test_app = Flask(__name__)
    test_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    # Initialize database with test config
    db.init_app(test_app)

    # Import and register routes manually
    with test_app.app_context():
        from routes.misc import ns_misc
        from routes.sessions import ns_sessions
        from routes.context import ns_context
        from routes.testing_routes import api as ns_testing
        from routes.auth_routes import api as ns_auth
        from flask_restx import Api
        from flask_cors import CORS
        from auth import register_auth_check

        # Setup CORS
        CORS(test_app, resources={r"/api/v1/*": {"origins": "*"}})

        # Register auth check
        register_auth_check(test_app)

        # Setup API
        api = Api(test_app, title="Translator API", version="1.0", prefix="/api", doc="/api/docs")
        api.add_namespace(ns_misc, path="/v1/misc")
        api.add_namespace(ns_sessions, path="/v1/sessions")
        api.add_namespace(ns_context, path="/v1/context")
        api.add_namespace(ns_testing, path="/v1/testing")
        api.add_namespace(ns_auth, path="/v1/auth")

        # Create database tables
        db.create_all()
        yield test_app
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client for the application."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Return headers with valid API key authentication."""
    return {
        "x-api-key": "test-api-key",
        "Content-Type": "application/json",
    }


@pytest.fixture
def admin_headers():
    """Return headers with admin authentication."""
    return {
        "x-api-key": "test-api-key",
        "x-admin-secret": "test-admin-secret",
        "Content-Type": "application/json",
    }


@pytest.fixture
def mock_azure_translation(mocker):
    """Mock Azure OpenAI translation API response."""
    mock_response = mocker.Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": "Mocked translation result"
            }
        }]
    }

    mocker.patch("requests.post", return_value=mock_response)
    return mock_response


@pytest.fixture
def sample_session(app, client, auth_headers):
    """Create a sample translation session for testing."""
    with app.app_context():
        from db.sql import db
        from models.translation_session import TranslationSession

        session = TranslationSession(
            from_language="da",
            to_language="ar",
            from_language_name="Danish",
            to_language_name="Arabic",
            status="active"
        )
        db.session.add(session)
        db.session.commit()

        yield {
            "session_id": session.id,
            "from_language": session.from_language,
            "to_language": session.to_language,
        }


@pytest.fixture
def sample_system_settings(app):
    """Create sample system settings for testing."""
    with app.app_context():
        from db.sql import db
        from models.system_settings import SystemSettings

        settings = [
            SystemSettings(
                setting_key="context_enhancement_enabled",
                setting_value="true",
                setting_type="boolean",
                description="Enable context enhancement"
            ),
            SystemSettings(
                setting_key="translation_prompt_mode",
                setting_value="default",
                setting_type="text",
                description="Translation prompt mode"
            ),
        ]

        for setting in settings:
            db.session.add(setting)
        db.session.commit()

        yield settings
