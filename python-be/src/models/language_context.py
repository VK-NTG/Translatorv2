from datetime import datetime
from db.sql import db


class LanguageContext(db.Model):
    """
    Stores language-specific context and cultural settings for enhanced translations.

    DATABASE SETUP NEEDED WHEN DB IS ACCESSIBLE:
    1. Run: flask db migrate -m "Add language_contexts table"
    2. Run: flask db upgrade
    3. Add sample data for Danish and other languages
    """
    __tablename__ = "language_contexts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    language_code = db.Column(db.String(10), nullable=False, unique=True)  # 'da-DK', 'ar-SA', etc.
    language_name = db.Column(db.String(100), nullable=False)  # 'Danish', 'Arabic', etc.

    # Formality settings
    formality_level = db.Column(db.String(20), nullable=False, default='formal')  # 'formal', 'informal', 'mixed'
    formality_notes = db.Column(db.Text)  # Cultural notes about formality expectations

    # Communication style guidance
    cultural_notes = db.Column(db.Text)  # General cultural communication patterns
    system_prompt = db.Column(db.Text)  # Language-specific prompt additions

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "language_code": self.language_code,
            "language_name": self.language_name,
            "formality_level": self.formality_level,
            "formality_notes": self.formality_notes,
            "cultural_notes": self.cultural_notes,
            "system_prompt": self.system_prompt,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active
        }

    @classmethod
    def get_by_language_code(cls, language_code):
        """Get language context by language code"""
        return cls.query.filter_by(language_code=language_code, is_active=True).first()

    @classmethod
    def get_all_active(cls):
        """Get all active language contexts"""
        return cls.query.filter_by(is_active=True).all()


# SAMPLE DATA TO INSERT WHEN DATABASE IS ACCESSIBLE:
"""
INSERT SAMPLE DATA:

# Danish context
LanguageContext(
    language_code='da-DK',
    language_name='Danish',
    formality_level='formal',
    formality_notes='Danish municipal communication should be polite but direct. Use "De" for formal address.',
    cultural_notes='Danish communication values clarity and directness. Municipal services expect respectful but straightforward language.',
    system_prompt='When translating to Danish for municipal services, use formal language ("De" instead of "du"), be direct and clear, and use appropriate municipal terminology.',
    default_domain='municipal_services'
)

# Arabic context
LanguageContext(
    language_code='ar-SA',
    language_name='Arabic (Saudi)',
    formality_level='very_formal',
    formality_notes='Arabic requires high formality in official contexts. Use appropriate honorifics and respectful language.',
    cultural_notes='Arabic communication in official contexts is more elaborate and formal than Danish. Respect and courtesy are paramount.',
    system_prompt='When translating to Arabic for official purposes, use highly formal and respectful language, include appropriate honorifics, and maintain a courteous tone throughout.',
    default_domain='municipal_services'
)
"""