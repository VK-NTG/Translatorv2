#!/usr/bin/env python3
"""
Test script to verify that contextual translation features are working correctly.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.app import app
from src.services.translation_service import get_translation_context, build_enhanced_system_prompt

def test_contextual_features():
    """Test the contextual translation features."""
    with app.app_context():
        print("🧪 Testing Contextual Translation Features")
        print("=" * 50)

        # Test 1: Danish text with municipal terminology
        test_text = "Vi har et nyt tilbud til borgere"
        print(f"\n📝 Test Text: '{test_text}'")

        # Get translation context
        print("\n🔍 Getting translation context...")
        context = get_translation_context(test_text, 'da-DK', 'en-US')

        print(f"✅ Context enhancement available: {context.get('enhancement_available')}")
        print(f"📚 Word definitions found: {len(context.get('relevant_definitions', []))}")

        if context.get('relevant_definitions'):
            print("\n📖 Found word definitions:")
            for def_ in context['relevant_definitions']:
                word = def_['word']
                definition = def_['definition'][:80] + "..." if len(def_['definition']) > 80 else def_['definition']
                print(f"  • '{word}': {definition}")
                if def_.get('translation_hints'):
                    hints = def_['translation_hints'][:60] + "..." if len(def_['translation_hints']) > 60 else def_['translation_hints']
                    print(f"    💡 Translation hint: {hints}")

        # Test 2: Enhanced system prompt
        print("\n🎯 Building enhanced system prompt...")
        prompt = build_enhanced_system_prompt('da-DK', 'en-US', context, test_text)

        print(f"📏 Prompt length: {len(prompt)} characters")
        print(f"🔍 Contains terminology section: {'TERMINOLOGY CONTEXT:' in prompt}")
        print(f"🌍 Contains cultural context: {'CULTURAL ADAPTATION' in prompt}")
        print(f"⚙️  Contains language pair info: {'LANGUAGE PAIR:' in prompt}")

        # Test 3: Show sample of enhanced prompt
        print("\n📋 Sample of enhanced prompt:")
        print("-" * 40)
        lines = prompt.split('\n')
        for i, line in enumerate(lines[:15]):  # Show first 15 lines
            print(f"{i+1:2d}: {line}")
        if len(lines) > 15:
            print(f"... ({len(lines) - 15} more lines)")

        # Test 4: Test with different language pair
        print(f"\n🔄 Testing with Arabic translation...")
        context_ar = get_translation_context(test_text, 'da-DK', 'ar-SA')
        print(f"🌍 Arabic context available: {context_ar.get('enhancement_available')}")

        if context_ar.get('to_language_context'):
            lang_context = context_ar['to_language_context']
            print(f"📝 Language: {lang_context.get('language_name')}")
            print(f"🎭 Formality level: {lang_context.get('formality_level')}")

        print("\n✅ Contextual translation features test completed!")

if __name__ == "__main__":
    test_contextual_features()