"""
Tests for the security utilities module.
"""
import os
import pytest
from pathlib import Path


class TestSanitizeFilename:
    """Tests for sanitize_filename function."""

    def test_sanitize_basic_filename(self):
        """Test sanitization of a basic valid filename."""
        from utils.security import sanitize_filename

        result = sanitize_filename("audio.wav", allowed_extensions={".wav"})
        # Should have UUID prefix
        assert result.endswith(".wav")
        assert "_audio.wav" in result

    def test_sanitize_removes_path_traversal(self):
        """Test that path traversal attempts are blocked."""
        from utils.security import sanitize_filename

        result = sanitize_filename("../../../etc/passwd.wav", allowed_extensions={".wav"})
        assert ".." not in result
        assert "/" not in result

    def test_sanitize_removes_special_characters(self):
        """Test that special characters are removed."""
        from utils.security import sanitize_filename

        result = sanitize_filename("audio<script>.wav", allowed_extensions={".wav"})
        assert "<" not in result
        assert ">" not in result
        assert "script" in result.lower()

    def test_sanitize_rejects_invalid_extension(self):
        """Test that invalid extensions raise ValidationError."""
        from utils.security import sanitize_filename, ValidationError

        with pytest.raises(ValidationError) as exc_info:
            sanitize_filename("malicious.exe", allowed_extensions={".wav", ".mp3"})

        assert "extension" in str(exc_info.value).lower()

    def test_sanitize_allows_various_audio_extensions(self):
        """Test that various audio extensions are allowed."""
        from utils.security import sanitize_filename, ALLOWED_AUDIO_EXTENSIONS

        for ext in ALLOWED_AUDIO_EXTENSIONS:
            result = sanitize_filename(f"audio{ext}")
            assert result.endswith(ext)

    def test_sanitize_case_insensitive_extension(self):
        """Test that extension matching is case-insensitive."""
        from utils.security import sanitize_filename

        result = sanitize_filename("audio.WAV", allowed_extensions={".wav"})
        assert result.endswith(".wav")

    def test_sanitize_adds_uuid_prefix(self):
        """Test that a UUID prefix is added."""
        from utils.security import sanitize_filename
        import re

        result = sanitize_filename("audio.wav", allowed_extensions={".wav"})
        # Check for UUID pattern at start
        uuid_pattern = r"^[a-f0-9]{8}_"
        assert re.match(uuid_pattern, result)

    def test_sanitize_handles_empty_filename(self):
        """Test handling of empty filename."""
        from utils.security import sanitize_filename, ValidationError

        with pytest.raises(ValidationError):
            sanitize_filename("", allowed_extensions={".wav"})

    def test_sanitize_handles_none_filename(self):
        """Test handling of None filename."""
        from utils.security import sanitize_filename, ValidationError

        with pytest.raises(ValidationError):
            sanitize_filename(None, allowed_extensions={".wav"})


class TestSafeAudioPath:
    """Tests for safe_audio_path function."""

    def test_safe_audio_path_returns_tmp_path(self):
        """Test that safe_audio_path returns a path in /tmp."""
        from utils.security import safe_audio_path

        result = safe_audio_path("recording.wav")
        assert result.startswith("/tmp/")
        assert result.endswith(".wav")

    def test_safe_audio_path_uses_sanitization(self):
        """Test that safe_audio_path applies sanitization."""
        from utils.security import safe_audio_path

        result = safe_audio_path("../malicious.wav")
        assert ".." not in result
        assert result.startswith("/tmp/")

    def test_safe_audio_path_validates_extension(self):
        """Test that safe_audio_path validates audio extensions."""
        from utils.security import safe_audio_path, ValidationError

        with pytest.raises(ValidationError):
            safe_audio_path("virus.exe")
