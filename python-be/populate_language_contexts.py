#!/usr/bin/env python3
"""
Populate language contexts with rich cultural data for better translations.
Run this script from the python-be directory to add cultural context for all supported languages.
"""

import sys
import os
sys.path.append('src')

from src.models.language_context import LanguageContext
from src.db.sql import db
from src.app import app

# Rich cultural data for each language
LANGUAGE_CONTEXTS = [
    {
        "language_code": "da-DK",
        "language_name": "Danish (Denmark)",
        "formality_level": "formal",
        "formality_notes": "Danish municipal communication should be polite but direct. Use 'De' for formal address in official contexts, though 'du' is becoming more common. Avoid excessive politeness - Danes value efficiency and clarity.",
        "cultural_notes": "Danish communication values 'hygge' (coziness) and directness. Be clear and concise. Danes appreciate honesty over diplomatic language. Municipal services expect respectful but straightforward communication without unnecessary formality.",
        "system_prompt": "When translating to/from Danish for municipal services: Use formal language ('De' for official documents, 'du' for casual), be direct and clear, use appropriate municipal terminology. Avoid overly flowery language - Danes prefer practical, efficient communication."
    },
    {
        "language_code": "da",
        "language_name": "Danish",
        "formality_level": "formal",
        "formality_notes": "Same as da-DK - Use 'De' for formal address in official contexts. Danes value direct, honest communication over excessive politeness.",
        "cultural_notes": "Danish communication culture emphasizes directness, efficiency, and equality. Avoid hierarchical language - Danes prefer egalitarian communication styles.",
        "system_prompt": "For Danish translations: Be direct and clear, use 'De' for formal contexts, avoid unnecessary complexity. Danish values practical, honest communication."
    },
    {
        "language_code": "en-US",
        "language_name": "English (United States)",
        "formality_level": "mixed",
        "formality_notes": "American English varies by context. Government/municipal: moderately formal but accessible. Use 'you' (no formal/informal distinction). Be professional but approachable.",
        "cultural_notes": "American communication tends to be direct but polite. Values clarity, accessibility, and customer service orientation. Municipal communications should be helpful and solution-focused.",
        "system_prompt": "For American English: Use clear, accessible language. Be professional but friendly. Include helpful context and next steps. Avoid overly bureaucratic language - Americans prefer plain English."
    },
    {
        "language_code": "nl-NL",
        "language_name": "Dutch (Netherlands)",
        "formality_level": "formal",
        "formality_notes": "Dutch uses 'u' for formal address in official contexts, 'je/jij' for informal. Municipal communications should use 'u'. Dutch directness is valued - be clear and to the point.",
        "cultural_notes": "Dutch communication is very direct and practical. Avoid beating around the bush - say what you mean clearly. Dutch people appreciate efficiency and honesty in municipal services.",
        "system_prompt": "For Dutch translations: Use 'u' for formal address, be direct and practical, use clear terminology. Dutch values straightforward, honest communication without excessive politeness."
    },
    {
        "language_code": "ar-EG",
        "language_name": "Arabic (Egypt)",
        "formality_level": "very_formal",
        "formality_notes": "Arabic requires high formality in official contexts. Use respectful forms of address, include appropriate honorifics. Government communications should be very respectful and formal.",
        "cultural_notes": "Arabic communication in official contexts is elaborate and formal. Respect and courtesy are paramount. Include appropriate religious/cultural greetings. High-context culture - reading between the lines is important.",
        "system_prompt": "For Arabic translations: Use highly formal and respectful language, include appropriate honorifics (حضرتك), maintain courteous tone throughout. Begin with greetings and show proper respect for the reader."
    },
    {
        "language_code": "uk-UA",
        "language_name": "Ukrainian (Ukraine)",
        "formality_level": "formal",
        "formality_notes": "Ukrainian uses 'Ви' for formal address in official contexts, 'ти' for informal. Government communications should maintain formal register and show respect for citizens.",
        "cultural_notes": "Ukrainian communication values respect and formality in official contexts. Be thorough and show consideration for the citizen's situation. Avoid overly bureaucratic language but maintain dignity.",
        "system_prompt": "For Ukrainian translations: Use 'Ви' for formal address, maintain respectful tone, be thorough but clear. Ukrainian values proper respect in official communications."
    },
    {
        "language_code": "sq-AL",
        "language_name": "Albanian (Albania)",
        "formality_level": "formal",
        "formality_notes": "Albanian uses formal 'Ju' in official contexts. Government communications should be respectful and formal while remaining accessible to citizens.",
        "cultural_notes": "Albanian communication values respect and traditional courtesy in official settings. Be formal but not overly complex. Show proper respect for authority and civic responsibility.",
        "system_prompt": "For Albanian translations: Use formal 'Ju' address, maintain respectful tone, be clear and accessible. Albanian values traditional courtesy in official communications."
    },
    {
        "language_code": "he-IL",
        "language_name": "Hebrew (Israel)",
        "formality_level": "mixed",
        "formality_notes": "Hebrew has complex formality levels. Government communications typically use polite but direct language. Israeli culture values directness even in formal contexts.",
        "cultural_notes": "Israeli communication is characteristically direct and informal even in official contexts. Be clear and to the point. Israelis appreciate efficiency and straightforward communication.",
        "system_prompt": "For Hebrew translations: Be direct but polite, use clear language, avoid unnecessary formality. Israeli culture values practical, efficient communication even in government contexts."
    },
    {
        "language_code": "ta-IN",
        "language_name": "Tamil (India)",
        "formality_level": "very_formal",
        "formality_notes": "Tamil has complex honorific systems. Government communications should use respectful forms appropriate to the context. Show proper respect for citizens and officials.",
        "cultural_notes": "Tamil communication in official contexts requires careful attention to respect levels and social hierarchy. Be formal and show appropriate deference while being helpful and clear.",
        "system_prompt": "For Tamil translations: Use appropriate honorific levels, maintain very respectful tone, be thorough and clear. Tamil values proper respect and courtesy in official communications."
    },
    {
        "language_code": "ca-ES",
        "language_name": "Catalan (Spain)",
        "formality_level": "formal",
        "formality_notes": "Catalan uses 'vostè' for formal address in official contexts. Government communications should be formal but accessible, respecting Catalan linguistic identity.",
        "cultural_notes": "Catalan communication values linguistic pride and cultural identity. Be respectful of language choice and cultural significance. Formal but warm communication style is preferred.",
        "system_prompt": "For Catalan translations: Use 'vostè' for formal address, respect linguistic identity, be formal but accessible. Catalan values cultural sensitivity and proper language use."
    },
    {
        "language_code": "sv-SE",
        "language_name": "Swedish (Sweden)",
        "formality_level": "mixed",
        "formality_notes": "Swedish traditionally used 'ni' for formal address, but 'du' is now common even in official contexts. Be polite but not overly formal - Swedes value egalitarian communication.",
        "cultural_notes": "Swedish communication emphasizes equality and consensus. Avoid hierarchical language. Be clear, helpful, and inclusive. Swedish society values accessibility and citizen participation.",
        "system_prompt": "For Swedish translations: Use 'du' in most contexts (even official), be clear and egalitarian, avoid unnecessarily complex language. Swedish values accessible, inclusive communication."
    },
    {
        "language_code": "pl-PL",
        "language_name": "Polish (Poland)",
        "formality_level": "formal",
        "formality_notes": "Polish uses complex politeness systems. Government communications should use formal 'Pan/Pani' address forms. Show appropriate respect while being helpful and clear.",
        "cultural_notes": "Polish communication values traditional courtesy and respect, especially in official contexts. Be thorough and show consideration for the citizen's dignity and concerns.",
        "system_prompt": "For Polish translations: Use formal 'Pan/Pani' address, maintain respectful tone, be thorough and considerate. Polish values traditional courtesy and proper respect in official communications."
    },
    {
        "language_code": "de-DE",
        "language_name": "German (Germany)",
        "formality_level": "very_formal",
        "formality_notes": "German requires 'Sie' in all official contexts. Government communications should be formal, thorough, and precise. Germans expect detailed, systematic information.",
        "cultural_notes": "German communication values precision, thoroughness, and systematic presentation. Be detailed and methodical. Germans appreciate comprehensive information and clear procedures.",
        "system_prompt": "For German translations: Always use 'Sie' for formal address, be thorough and systematic, provide detailed information. German values precision, completeness, and methodical communication."
    }
]

def populate_contexts():
    """Add language context data to the database."""

    with app.app_context():
        print("🌍 Populating language contexts...")

        for context_data in LANGUAGE_CONTEXTS:
            # Check if context already exists
            existing = LanguageContext.query.filter_by(
                language_code=context_data["language_code"]
            ).first()

            if existing:
                # Update existing context
                existing.language_name = context_data["language_name"]
                existing.formality_level = context_data["formality_level"]
                existing.formality_notes = context_data["formality_notes"]
                existing.cultural_notes = context_data["cultural_notes"]
                existing.system_prompt = context_data["system_prompt"]
                print(f"✅ Updated {context_data['language_code']} - {context_data['language_name']}")
            else:
                # Create new context
                new_context = LanguageContext(
                    language_code=context_data["language_code"],
                    language_name=context_data["language_name"],
                    formality_level=context_data["formality_level"],
                    formality_notes=context_data["formality_notes"],
                    cultural_notes=context_data["cultural_notes"],
                    system_prompt=context_data["system_prompt"]
                )
                db.session.add(new_context)
                print(f"🆕 Created {context_data['language_code']} - {context_data['language_name']}")

        # Commit all changes
        try:
            db.session.commit()
            print(f"\n🎉 Successfully populated {len(LANGUAGE_CONTEXTS)} language contexts!")
            print("\nLanguages added/updated:")
            for context in LANGUAGE_CONTEXTS:
                print(f"  • {context['language_name']} ({context['language_code']})")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error committing to database: {e}")
            return False

        return True

if __name__ == "__main__":
    print("🚀 Language Context Population Script")
    print("=" * 50)

    success = populate_contexts()

    if success:
        print("\n✨ All done! Your language contexts are now populated with rich cultural data.")
        print("📱 Refresh your settings page to see the new cultural information.")
    else:
        print("\n❌ Something went wrong. Check the error messages above.")