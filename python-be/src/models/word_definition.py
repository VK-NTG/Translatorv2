from datetime import datetime
from db.sql import db


class WordDefinition(db.Model):
    """
    Stores domain-specific word definitions and contextual meanings.
    For example: "Tilbud" in municipal context means "service offering", not "sale".

    DATABASE SETUP NEEDED WHEN DB IS ACCESSIBLE:
    1. Run: flask db migrate -m "Add word_definitions table"
    2. Run: flask db upgrade
    3. Add sample data for common municipal terms
    """
    __tablename__ = "word_definitions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Word identification
    word = db.Column(db.String(255), nullable=False)  # The actual word/term
    language_code = db.Column(db.String(10), nullable=False)  # 'da-DK', 'ar-SA', etc.

    # Context information
    context_type = db.Column(db.String(50), nullable=False)  # 'official_term', 'colloquial', 'technical', etc.

    # Definition and usage
    definition = db.Column(db.Text, nullable=False)  # Contextual meaning/definition
    usage_examples = db.Column(db.Text)  # Examples of how the word is used in this context
    translation_hints = db.Column(db.Text)  # Specific guidance for translators

    # Alternative terms
    synonyms = db.Column(db.Text)  # Alternative terms with same meaning
    avoid_translations = db.Column(db.Text)  # Translations to avoid (e.g., "sale" for "Tilbud")
    preferred_translations = db.Column(db.JSON)  # Preferred translations per target language

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=1)  # Higher priority terms are checked first

    def to_dict(self):
        return {
            "id": self.id,
            "word": self.word,
            "language_code": self.language_code,
            "context_type": self.context_type,
            "definition": self.definition,
            "usage_examples": self.usage_examples,
            "translation_hints": self.translation_hints,
            "synonyms": self.synonyms,
            "avoid_translations": self.avoid_translations,
            "preferred_translations": self.preferred_translations,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
            "priority": self.priority
        }

    @classmethod
    def find_definitions_for_text(cls, text, language_code):
        """Find word definitions that match terms in the given text"""
        # Split text into words and find matching definitions
        words = text.lower().split()
        definitions = []

        for word in words:
            definition = cls.query.filter_by(
                word=word.strip('.,!?'),
                language_code=language_code,
                is_active=True
            ).order_by(cls.priority.desc()).first()

            if definition:
                definitions.append(definition)

        return definitions

    @classmethod
    def get_by_context_and_language(cls, context_type, language_code):
        """Get all definitions for a specific context and language"""
        return cls.query.filter_by(
            context_type=context_type,
            language_code=language_code,
            is_active=True
        ).order_by(cls.priority.desc(), cls.word).all()

    @classmethod
    def get_all_context_types(cls):
        """Get all unique context types"""
        return db.session.query(cls.context_type).filter_by(is_active=True).distinct().all()


# SAMPLE DATA TO INSERT WHEN DATABASE IS ACCESSIBLE:
"""
INSERT SAMPLE DATA:

# Danish "Tilbud" in municipal context
WordDefinition(
    word='tilbud',
    language_code='da-DK',
    domain='municipal_services',
    context_type='official_term',
    definition='A service or program offered by the municipality to citizens, such as elder care, childcare, or social services.',
    usage_examples='Kommunen har et nyt tilbud til ældre borgere. (The municipality has a new service for elderly citizens.)',
    translation_hints='Never translate as "offer" or "sale". Always translate as "service", "program", or "provision" in municipal context.',
    synonyms='service, ydelse, program',
    avoid_translations='offer, sale, discount, deal',
    preferred_translations={
        'en-US': 'service',
        'ar-SA': 'خدمة',
        'de-DE': 'Dienstleistung'
    },
    priority=5
)

# Danish "Borger" in municipal context
WordDefinition(
    word='borger',
    language_code='da-DK',
    domain='municipal_services',
    context_type='official_term',
    definition='A citizen or resident who is entitled to municipal services.',
    usage_examples='Alle borgere har ret til information om kommunens tilbud.',
    translation_hints='More formal than "person" - implies civic relationship with municipality.',
    preferred_translations={
        'en-US': 'citizen',
        'ar-SA': 'مواطن',
        'de-DE': 'Bürger'
    },
    priority=4
)
"""