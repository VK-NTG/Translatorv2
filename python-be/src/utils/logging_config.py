"""
Centralized logging configuration for KK-AI-Translator.

Provides a consistent logging setup across the application.
"""
import logging
import os
import sys
from typing import Optional


def setup_logging(
    app_name: str = "kk-translator",
    log_level: Optional[str] = None,
    log_format: Optional[str] = None
) -> logging.Logger:
    """
    Configure application-wide logging.

    This function:
    - Sets up the root logger with appropriate handlers
    - Configures log level from environment variable or parameter
    - Suppresses noisy third-party loggers
    - Uses consistent formatting across all loggers

    Args:
        app_name: Name for the application logger
        log_level: Override log level (default: from LOG_LEVEL env var or INFO)
        log_format: Override log format string

    Returns:
        The configured root logger

    Environment Variables:
        LOG_LEVEL: Set to DEBUG, INFO, WARNING, ERROR, or CRITICAL
    """
    # Determine log level
    if log_level is None:
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    # Validate log level
    numeric_level = getattr(logging, log_level, None)
    if not isinstance(numeric_level, int):
        print(f"Invalid log level: {log_level}, defaulting to INFO")
        numeric_level = logging.INFO

    # Default format includes timestamp, level, logger name, and message
    if log_format is None:
        log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove existing handlers to avoid duplicates
    root_logger.handlers = []

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(logging.Formatter(log_format))
    root_logger.addHandler(console_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("azure").setLevel(logging.WARNING)
    logging.getLogger("azure.cognitiveservices").setLevel(logging.WARNING)

    # Create application logger
    app_logger = logging.getLogger(app_name)
    app_logger.info("Logging configured: level=%s", log_level)

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.

    This is a convenience function that ensures loggers use the
    configured handlers.

    Args:
        name: Logger name (typically __name__ of the module)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)
