# Import all models so Flask-Migrate can detect them
from .session import Session
from .translation import Translation
from .system_settings import SystemSettings
from .language_context import LanguageContext
from .word_definition import WordDefinition

__all__ = [
    'Session',
    'Translation',
    'SystemSettings',
    'LanguageContext',
    'WordDefinition'
]