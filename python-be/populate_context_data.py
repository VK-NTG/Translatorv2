#!/usr/bin/env python3
"""
Populate the database with sample contextual translation data.

This script adds the sample data for system settings, language contexts,
and word definitions to enable the enhanced translation features.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.app import app
from src.db.sql import db
from src.models.system_settings import SystemSettings
from src.models.language_context import LanguageContext
from src.models.word_definition import WordDefinition
import json

def populate_system_settings():
    """Add default system settings."""
    print("📝 Adding system settings...")

    settings = [
        {
            'setting_key': 'base_system_prompt',
            'setting_name': 'Base System Prompt',
            'description': 'The foundational prompt used for all translations',
            'setting_value': 'You are a professional interpreter working for Kalundborg Municipality. Your role is to provide accurate, culturally appropriate translations that maintain the intent and tone of the original message. Always consider the cultural context of both the source and target languages.',
            'setting_type': 'text',
            'category': 'prompts',
            'is_user_configurable': True
        },
        {
            'setting_key': 'default_domain',
            'setting_name': 'Default Domain',
            'description': 'The default domain/context for translations',
            'setting_value': 'municipal_services',
            'setting_type': 'text',
            'category': 'behavior',
            'is_user_configurable': True
        },
        {
            'setting_key': 'available_domains',
            'setting_name': 'Available Domains',
            'description': 'List of available translation domains',
            'setting_value': json.dumps(['municipal_services', 'healthcare', 'legal', 'education', 'social_services']),
            'setting_type': 'json',
            'category': 'behavior',
            'is_user_configurable': True
        },
        {
            'setting_key': 'context_enhancement_enabled',
            'setting_name': 'Context Enhancement Enabled',
            'description': 'Whether to use contextual enhancements in translations',
            'setting_value': 'true',
            'setting_type': 'boolean',
            'category': 'behavior',
            'is_user_configurable': True
        }
    ]

    for setting_data in settings:
        existing = SystemSettings.query.filter_by(setting_key=setting_data['setting_key']).first()
        if not existing:
            setting = SystemSettings(**setting_data)
            db.session.add(setting)
            print(f"   ✅ Added: {setting_data['setting_name']}")
        else:
            print(f"   ⏭️  Skipped: {setting_data['setting_name']} (already exists)")

def populate_language_contexts():
    """Add default language contexts."""
    print("\n🌍 Adding language contexts...")

    contexts = [
        {
            'language_code': 'da-DK',
            'language_name': 'Danish',
            'formality_level': 'formal',
            'formality_notes': 'Danish municipal communication should be polite but direct. Use "De" for formal address.',
            'cultural_notes': 'Danish communication values clarity and directness. Municipal services expect respectful but straightforward language.',
            'system_prompt': 'When translating to Danish for municipal services, use formal language ("De" instead of "du"), be direct and clear, and use appropriate municipal terminology.',
            'default_domain': 'municipal_services'
        },
        {
            'language_code': 'ar-SA',
            'language_name': 'Arabic (Saudi)',
            'formality_level': 'very_formal',
            'formality_notes': 'Arabic requires high formality in official contexts. Use appropriate honorifics and respectful language.',
            'cultural_notes': 'Arabic communication in official contexts is more elaborate and formal than Danish. Respect and courtesy are paramount.',
            'system_prompt': 'When translating to Arabic for official purposes, use highly formal and respectful language, include appropriate honorifics, and maintain a courteous tone throughout.',
            'default_domain': 'municipal_services'
        },
        {
            'language_code': 'es-ES',
            'language_name': 'Spanish (Spain)',
            'formality_level': 'formal',
            'formality_notes': 'Spanish uses "usted" for formal address in official contexts.',
            'cultural_notes': 'Spanish communication in municipal contexts should be respectful and clear.',
            'system_prompt': 'When translating to Spanish for official purposes, use formal address ("usted") and maintain professional tone.',
            'default_domain': 'municipal_services'
        },
        {
            'language_code': 'en-US',
            'language_name': 'English (US)',
            'formality_level': 'formal',
            'formality_notes': 'American English in municipal contexts should be professional but accessible.',
            'cultural_notes': 'American English values clarity and directness while maintaining politeness.',
            'system_prompt': 'When translating to American English for municipal purposes, use clear, professional language that is accessible to all education levels.',
            'default_domain': 'municipal_services'
        }
    ]

    for context_data in contexts:
        existing = LanguageContext.query.filter_by(language_code=context_data['language_code']).first()
        if not existing:
            context = LanguageContext(**context_data)
            db.session.add(context)
            print(f"   ✅ Added: {context_data['language_name']} ({context_data['language_code']})")
        else:
            print(f"   ⏭️  Skipped: {context_data['language_name']} (already exists)")

def populate_word_definitions():
    """Add default word definitions."""
    print("\n📚 Adding word definitions...")

    definitions = [
        {
            'word': 'tilbud',
            'language_code': 'da-DK',
            'context_type': 'official_term',
            'definition': 'A service or program offered by the municipality to citizens, such as elder care, childcare, or social services.',
            'usage_examples': 'Kommunen har et nyt tilbud til ældre borgere. (The municipality has a new service for elderly citizens.)',
            'translation_hints': 'Never translate as "offer" or "sale". Always translate as "service", "program", or "provision" in municipal context.',
            'synonyms': 'service, ydelse, program',
            'avoid_translations': 'offer, sale, discount, deal',
            'preferred_translations': json.dumps({
                'en-US': 'service',
                'ar-SA': 'خدمة',
                'de-DE': 'Dienstleistung',
                'es-ES': 'servicio'
            }),
            'priority': 5
        },
        {
            'word': 'borger',
            'language_code': 'da-DK',
            'context_type': 'official_term',
            'definition': 'A citizen or resident who is entitled to municipal services.',
            'usage_examples': 'Alle borgere har ret til information om kommunens tilbud.',
            'translation_hints': 'More formal than "person" - implies civic relationship with municipality.',
            'preferred_translations': json.dumps({
                'en-US': 'citizen',
                'ar-SA': 'مواطن',
                'de-DE': 'Bürger',
                'es-ES': 'ciudadano'
            }),
            'priority': 4
        },
        {
            'word': 'sagsbehandling',
            'language_code': 'da-DK',
            'context_type': 'official_term',
            'definition': 'The administrative process of handling citizen cases or applications in the municipality.',
            'usage_examples': 'Sagsbehandlingen tager normalt 14 dage.',
            'translation_hints': 'Technical administrative term - use formal bureaucratic equivalent in target language.',
            'preferred_translations': json.dumps({
                'en-US': 'case processing',
                'ar-SA': 'معالجة القضايا',
                'de-DE': 'Sachbearbeitung',
                'es-ES': 'tramitación de casos'
            }),
            'priority': 3
        },
        {
            'word': 'kommune',
            'language_code': 'da-DK',
            'context_type': 'official_term',
            'definition': 'The local government administrative unit responsible for municipal services.',
            'usage_examples': 'Kontakt kommunen for yderligere information.',
            'translation_hints': 'Official administrative entity - use appropriate government term in target language.',
            'preferred_translations': json.dumps({
                'en-US': 'municipality',
                'ar-SA': 'البلدية',
                'de-DE': 'Gemeinde',
                'es-ES': 'municipio'
            }),
            'priority': 4
        },
        {
            'word': 'ansøgning',
            'language_code': 'da-DK',
            'context_type': 'official_term',
            'definition': 'A formal request or application submitted to the municipality for services or permits.',
            'usage_examples': 'Send din ansøgning til kommunen.',
            'translation_hints': 'Formal administrative document - use official application terminology.',
            'preferred_translations': json.dumps({
                'en-US': 'application',
                'ar-SA': 'طلب',
                'de-DE': 'Antrag',
                'es-ES': 'solicitud'
            }),
            'priority': 3
        }
    ]

    for definition_data in definitions:
        existing = WordDefinition.query.filter_by(
            word=definition_data['word'],
            language_code=definition_data['language_code']
        ).first()
        if not existing:
            definition = WordDefinition(**definition_data)
            db.session.add(definition)
            print(f"   ✅ Added: '{definition_data['word']}' ({definition_data['language_code']})")
        else:
            print(f"   ⏭️  Skipped: '{definition_data['word']}' (already exists)")

def main():
    """Populate all contextual translation data."""
    print("🚀 Populating Contextual Translation Database")
    print("=" * 50)

    with app.app_context():
        try:
            populate_system_settings()
            populate_language_contexts()
            populate_word_definitions()

            print("\n💾 Committing changes to database...")
            db.session.commit()

            print("\n🎉 Database population completed successfully!")
            print("\nSummary:")
            print(f"📝 System Settings: {SystemSettings.query.count()} total")
            print(f"🌍 Language Contexts: {LanguageContext.query.count()} total")
            print(f"📚 Word Definitions: {WordDefinition.query.count()} total")

        except Exception as e:
            print(f"\n❌ Error populating database: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()