"""
Security utilities for input sanitization.

Provides functions for safely handling user-provided filenames
and other potentially dangerous input.
"""
import os
import re
import uuid
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

# Allowed audio file extensions for upload
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac", ".aac"}

# Maximum filename length
MAX_FILENAME_LENGTH = 255


def sanitize_filename(
    filename: str,
    allowed_extensions: set = None,
    add_uuid_prefix: bool = True
) -> str:
    """
    Sanitize a filename for safe filesystem operations.

    This function:
    1. Uses werkzeug's secure_filename to remove dangerous characters
    2. Validates the file extension against an allowed list
    3. Optionally adds a UUID prefix to prevent filename collisions
    4. Ensures the filename isn't too long

    Args:
        filename: Original filename from user input
        allowed_extensions: Set of allowed file extensions (e.g., {'.wav', '.mp3'})
                          If None, all extensions are allowed
        add_uuid_prefix: If True, adds a UUID prefix to the filename

    Returns:
        Safe filename

    Raises:
        ValueError: If filename is empty, extension is not allowed, or filename is too long
    """
    if not filename:
        raise ValueError("Filename cannot be empty")

    # Use werkzeug's secure_filename to remove dangerous characters
    safe_name = secure_filename(filename)

    if not safe_name:
        # If secure_filename returns empty string, generate a random name
        safe_name = f"file_{uuid.uuid4().hex[:8]}"
        logger.warning("Original filename '%s' was sanitized to '%s'", filename, safe_name)

    # Extract and validate extension
    _, ext = os.path.splitext(safe_name)
    ext = ext.lower()

    if allowed_extensions is not None and ext not in allowed_extensions:
        raise ValueError(
            f"File extension '{ext}' not allowed. Allowed extensions: {sorted(allowed_extensions)}"
        )

    # Add UUID prefix to prevent filename collisions and make guessing harder
    if add_uuid_prefix:
        unique_prefix = uuid.uuid4().hex[:12]
        safe_name = f"{unique_prefix}_{safe_name}"

    # Ensure filename isn't too long
    if len(safe_name) > MAX_FILENAME_LENGTH:
        # Truncate the name but keep the extension
        name_without_ext = os.path.splitext(safe_name)[0]
        max_name_len = MAX_FILENAME_LENGTH - len(ext)
        safe_name = name_without_ext[:max_name_len] + ext

    return safe_name


def safe_audio_path(filename: str) -> str:
    """
    Get a safe temporary path for an audio file.

    Args:
        filename: Original filename from user upload

    Returns:
        Safe absolute path in /tmp directory

    Raises:
        ValueError: If filename is invalid or has disallowed extension
    """
    safe_name = sanitize_filename(filename, allowed_extensions=ALLOWED_AUDIO_EXTENSIONS)
    return os.path.join("/tmp", safe_name)


def validate_language_code(code: str) -> bool:
    """
    Validate a language code format.

    Accepts formats like:
    - 'en'
    - 'en-US'
    - 'zh-Hans-CN'

    Args:
        code: Language code to validate

    Returns:
        True if valid, False otherwise
    """
    if not code or not isinstance(code, str):
        return False

    # Language code pattern: 2-3 letter language, optional script, optional region
    pattern = r'^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2})?$'
    return bool(re.match(pattern, code))


def sanitize_text_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize text input for safe processing.

    Args:
        text: User-provided text
        max_length: Maximum allowed length

    Returns:
        Sanitized text

    Raises:
        ValueError: If text exceeds max_length
    """
    if not text:
        return ""

    text = text.strip()

    if len(text) > max_length:
        raise ValueError(f"Text exceeds maximum length of {max_length} characters")

    return text
