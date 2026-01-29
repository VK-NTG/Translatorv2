#!/usr/bin/env python3
"""
Simple script to add sample contextual translation data to the database.
Run this from the python-be directory.
"""

import sys
import os
import json

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import Flask app and models
from app import app
from db.sql import db
from models.system_settings import SystemSettings
from models.language_context import LanguageContext
from models.word_definition import WordDefinition

def add_sample_data():
    """Add sample data to the database."""
    with app.app_context():
        print("🚀 Adding sample contextual translation data...")

        # System Settings
        settings = [
            ('base_system_prompt', 'You are a professional interpreter working for Kalundborg Municipality. Your role is to provide accurate, culturally appropriate translations that maintain the intent and tone of the original message. Always consider the cultural context of both the source and target languages.', 'text'),
            ('default_domain', 'municipal_services', 'text'),
            ('available_domains', json.dumps(['municipal_services', 'healthcare', 'legal', 'education', 'social_services']), 'json'),
            ('context_enhancement_enabled', 'true', 'boolean')
        ]

        for key, value, setting_type in settings:
            if not SystemSettings.query.filter_by(setting_key=key).first():
                setting = SystemSettings(
                    setting_key=key,
                    setting_name=key.replace('_', ' ').title(),
                    setting_value=value,
                    setting_type=setting_type,
                    category='general',
                    is_user_configurable=True
                )
                db.session.add(setting)
                print(f"✅ Added system setting: {key}")

        # Language Contexts
        contexts = [
            ('da-DK', 'Danish', 'formal', 'Danish municipal communication should be polite but direct. Use "De" for formal address.'),
            ('ar-SA', 'Arabic (Saudi)', 'very_formal', 'Arabic requires high formality in official contexts. Use appropriate honorifics and respectful language.'),
            ('es-ES', 'Spanish (Spain)', 'formal', 'Spanish uses "usted" for formal address in official contexts.'),
            ('en-US', 'English (US)', 'formal', 'American English in municipal contexts should be professional but accessible.')
        ]

        for code, name, formality, notes in contexts:
            if not LanguageContext.query.filter_by(language_code=code).first():
                context = LanguageContext(
                    language_code=code,
                    language_name=name,
                    formality_level=formality,
                    formality_notes=notes,
                    default_domain='municipal_services'
                )
                db.session.add(context)
                print(f"✅ Added language context: {name} ({code})")

        # Word Definitions
        definitions = [
            ('tilbud', 'da-DK', 'A service or program offered by the municipality to citizens', 'Never translate as "offer" or "sale". Always translate as "service", "program", or "provision" in municipal context.', json.dumps({'en-US': 'service', 'ar-SA': 'خدمة', 'es-ES': 'servicio'}), 5),
            ('borger', 'da-DK', 'A citizen or resident who is entitled to municipal services', 'More formal than "person" - implies civic relationship with municipality.', json.dumps({'en-US': 'citizen', 'ar-SA': 'مواطن', 'es-ES': 'ciudadano'}), 4),
            ('kommune', 'da-DK', 'The local government administrative unit responsible for municipal services', 'Official administrative entity - use appropriate government term in target language.', json.dumps({'en-US': 'municipality', 'ar-SA': 'البلدية', 'es-ES': 'municipio'}), 4),
            ('ansøgning', 'da-DK', 'A formal request or application submitted to the municipality for services or permits', 'Formal administrative document - use official application terminology.', json.dumps({'en-US': 'application', 'ar-SA': 'طلب', 'es-ES': 'solicitud'}), 3)
        ]

        for word, lang_code, definition, hints, translations, priority in definitions:
            if not WordDefinition.query.filter_by(word=word, language_code=lang_code).first():
                word_def = WordDefinition(
                    word=word,
                    language_code=lang_code,
                    domain='municipal_services',
                    context_type='official_term',
                    definition=definition,
                    translation_hints=hints,
                    preferred_translations=translations,
                    priority=priority
                )
                db.session.add(word_def)
                print(f"✅ Added word definition: {word}")

        # Commit all changes
        db.session.commit()
        print("\n🎉 Sample data added successfully!")

        # Print summary
        print(f"\n📊 Summary:")
        print(f"   System Settings: {SystemSettings.query.count()}")
        print(f"   Language Contexts: {LanguageContext.query.count()}")
        print(f"   Word Definitions: {WordDefinition.query.count()}")

if __name__ == "__main__":
    add_sample_data()