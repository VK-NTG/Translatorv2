"""
Tests for the error handling utilities module.
"""
import pytest


class TestTranslatorErrors:
    """Tests for custom exception classes."""

    def test_translator_error_base_class(self):
        """Test TranslatorError base class."""
        from utils.errors import TranslatorError

        error = TranslatorError("Test error", {"key": "value"})

        assert error.message == "Test error"
        assert error.details == {"key": "value"}
        assert error.status_code == 500
        assert error.error_code == "INTERNAL_ERROR"

    def test_translator_error_to_dict(self):
        """Test TranslatorError.to_dict() method."""
        from utils.errors import TranslatorError

        error = TranslatorError("Test error", {"detail": "info"})
        result = error.to_dict()

        assert result["error"] == "Test error"
        assert result["error_code"] == "INTERNAL_ERROR"
        assert result["details"] == {"detail": "info"}

    def test_translator_error_without_details(self):
        """Test TranslatorError without details."""
        from utils.errors import TranslatorError

        error = TranslatorError("Simple error")
        result = error.to_dict()

        assert result["error"] == "Simple error"
        assert "details" not in result

    def test_validation_error(self):
        """Test ValidationError class."""
        from utils.errors import ValidationError

        error = ValidationError("Invalid input")

        assert error.status_code == 400
        assert error.error_code == "VALIDATION_ERROR"

    def test_not_found_error(self):
        """Test NotFoundError class."""
        from utils.errors import NotFoundError

        error = NotFoundError("Resource not found")

        assert error.status_code == 404
        assert error.error_code == "NOT_FOUND"

    def test_authentication_error(self):
        """Test AuthenticationError class."""
        from utils.errors import AuthenticationError

        error = AuthenticationError("Invalid credentials")

        assert error.status_code == 401
        assert error.error_code == "AUTHENTICATION_ERROR"

    def test_authorization_error(self):
        """Test AuthorizationError class."""
        from utils.errors import AuthorizationError

        error = AuthorizationError("Permission denied")

        assert error.status_code == 403
        assert error.error_code == "AUTHORIZATION_ERROR"

    def test_rate_limit_error(self):
        """Test RateLimitError class."""
        from utils.errors import RateLimitError

        error = RateLimitError("Too many requests")

        assert error.status_code == 429
        assert error.error_code == "RATE_LIMIT_EXCEEDED"

    def test_external_service_error(self):
        """Test ExternalServiceError class."""
        from utils.errors import ExternalServiceError

        error = ExternalServiceError("Azure API unavailable")

        assert error.status_code == 502
        assert error.error_code == "EXTERNAL_SERVICE_ERROR"

    def test_transcription_error(self):
        """Test TranscriptionError class."""
        from utils.errors import TranscriptionError

        error = TranscriptionError("Audio transcription failed")

        assert error.status_code == 502  # Inherits from ExternalServiceError
        assert error.error_code == "TRANSCRIPTION_ERROR"

    def test_translation_error(self):
        """Test TranslationError class."""
        from utils.errors import TranslationError

        error = TranslationError("Translation failed")

        assert error.status_code == 502
        assert error.error_code == "TRANSLATION_ERROR"

    def test_tts_error(self):
        """Test TTSError class."""
        from utils.errors import TTSError

        error = TTSError("Text-to-speech failed")

        assert error.status_code == 502
        assert error.error_code == "TTS_ERROR"

    def test_database_error(self):
        """Test DatabaseError class."""
        from utils.errors import DatabaseError

        error = DatabaseError("Database connection failed")

        assert error.status_code == 500
        assert error.error_code == "DATABASE_ERROR"

    def test_configuration_error(self):
        """Test ConfigurationError class."""
        from utils.errors import ConfigurationError

        error = ConfigurationError("Missing configuration")

        assert error.status_code == 500
        assert error.error_code == "CONFIGURATION_ERROR"


class TestErrorHandlingDecorator:
    """Tests for the handle_errors decorator."""

    def test_handle_errors_passes_through_success(self):
        """Test that successful function calls pass through."""
        from utils.errors import handle_errors

        @handle_errors()
        def successful_function():
            return {"status": "ok"}, 200

        result, status = successful_function()
        assert result == {"status": "ok"}
        assert status == 200

    def test_handle_errors_catches_translator_error(self):
        """Test that TranslatorError is caught and converted."""
        from utils.errors import handle_errors, ValidationError

        @handle_errors()
        def failing_function():
            raise ValidationError("Bad input", {"field": "name"})

        result, status = failing_function()
        assert status == 400
        assert result["error"] == "Bad input"
        assert result["error_code"] == "VALIDATION_ERROR"

    def test_handle_errors_catches_mapped_exceptions(self):
        """Test that mapped exceptions are converted."""
        from utils.errors import handle_errors

        @handle_errors(error_map={ValueError: (400, "Invalid value")})
        def failing_function():
            raise ValueError("Wrong type")

        result, status = failing_function()
        assert status == 400
        assert result["error"] == "Invalid value"

    def test_handle_errors_catches_unhandled_exceptions(self):
        """Test that unhandled exceptions return 500."""
        from utils.errors import handle_errors

        @handle_errors(default_message="Something went wrong")
        def failing_function():
            raise RuntimeError("Unexpected error")

        result, status = failing_function()
        assert status == 500
        assert result["error"] == "Something went wrong"
        assert result["error_code"] == "INTERNAL_ERROR"


class TestLogAndRaise:
    """Tests for the log_and_raise helper function."""

    def test_log_and_raise_raises_exception(self):
        """Test that log_and_raise raises the specified exception."""
        from utils.errors import log_and_raise, ValidationError

        with pytest.raises(ValidationError) as exc_info:
            log_and_raise(ValidationError, "Test message", {"key": "value"})

        assert exc_info.value.message == "Test message"
        assert exc_info.value.details == {"key": "value"}

    def test_log_and_raise_chains_original_exception(self):
        """Test that log_and_raise chains the original exception."""
        from utils.errors import log_and_raise, TranslationError

        original = RuntimeError("Original error")

        with pytest.raises(TranslationError) as exc_info:
            log_and_raise(TranslationError, "Wrapped error", None, original)

        assert exc_info.value.__cause__ is original
