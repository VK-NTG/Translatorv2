"""
Translation Quality Testing Dataset

Curated test cases for evaluating translation quality, temperature, and prompt effectiveness.
Includes municipal terms, common phrases, and edge cases.
"""

# Test cases: (source_lang, target_lang, input_text, expected_translation, category)
TRANSLATION_TEST_CASES = [
    # === BASIC WORDS ===
    ("en", "da", "test", "test", "basic_words"),
    ("en", "da", "hello", "hej", "basic_words"),
    ("en", "da", "goodbye", "farvel", "basic_words"),
    ("en", "da", "thank you", "tak", "basic_words"),
    ("en", "da", "yes", "ja", "basic_words"),
    ("en", "da", "no", "nej", "basic_words"),
    ("en", "da", "help", "hjælp", "basic_words"),
    ("en", "da", "please", "tak", "basic_words"),
    ("en", "da", "sorry", "undskyld", "basic_words"),
    ("en", "da", "excuse me", "undskyld", "basic_words"),

    # === MUNICIPAL TERMS (Danish to other languages) ===
    ("da", "en", "tilbud", "service", "municipal_terms"),  # NOT "offer"!
    ("da", "en", "ansøgning", "application", "municipal_terms"),
    ("da", "en", "borgerservice", "citizen service", "municipal_terms"),
    ("da", "en", "sagsbehandler", "case worker", "municipal_terms"),
    ("da", "en", "kommune", "municipality", "municipal_terms"),
    ("da", "en", "borger.dk", "borger.dk", "municipal_terms"),  # Keep unchanged
    ("da", "en", "nemid", "NemID", "municipal_terms"),  # Keep unchanged
    ("da", "en", "cpr-nummer", "CPR number", "municipal_terms"),
    ("da", "en", "folkeregister", "civil registration", "municipal_terms"),
    ("da", "en", "skatteforvaltning", "tax administration", "municipal_terms"),

    # === ARABIC TRANSLATIONS ===
    ("en", "ar", "hello", "مرحبا", "basic_arabic"),
    ("en", "ar", "thank you", "شكرا", "basic_arabic"),
    ("en", "ar", "help", "مساعدة", "basic_arabic"),
    ("en", "ar", "application", "طلب", "municipal_arabic"),
    ("en", "ar", "municipality", "بلدية", "municipal_arabic"),
    ("da", "ar", "hej", "مرحبا", "danish_arabic"),
    ("da", "ar", "tak", "شكرا", "danish_arabic"),
    ("da", "ar", "kommune", "بلدية", "danish_arabic"),

    # === COMMON PHRASES ===
    ("en", "da", "How are you?", "Hvordan har du det?", "common_phrases"),
    ("en", "da", "I need help", "Jeg har brug for hjælp", "common_phrases"),
    ("en", "da", "Where is the bathroom?", "Hvor er toilettet?", "common_phrases"),
    ("da", "en", "Jeg forstår ikke", "I don't understand", "common_phrases"),
    ("da", "en", "Kan du hjælpe mig?", "Can you help me?", "common_phrases"),
    ("da", "en", "Hvad koster det?", "How much does it cost?", "common_phrases"),

    # === MUNICIPAL SERVICE PHRASES ===
    ("en", "da", "I want to apply for benefits", "Jeg vil ansøge om ydelser", "municipal_services"),
    ("en", "da", "I need a new passport", "Jeg har brug for et nyt pas", "municipal_services"),
    ("en", "da", "Where do I register my address?", "Hvor registrerer jeg min adresse?", "municipal_services"),
    ("da", "en", "Du skal udfylde denne formular", "You need to fill out this form", "municipal_services"),
    ("da", "en", "Har du dit cpr-nummer med?", "Do you have your CPR number with you?", "municipal_services"),
    ("da", "en", "Sagsbehandlingstiden er 3 uger", "The processing time is 3 weeks", "municipal_services"),

    # === EDGE CASES & POTENTIAL PROBLEMS ===
    ("en", "da", "test test test", "test test test", "edge_cases"),
    ("en", "da", "a", "en", "edge_cases"),  # Single letter
    ("en", "da", "123", "123", "edge_cases"),  # Numbers should stay
    ("en", "da", "hello@example.com", "hello@example.com", "edge_cases"),  # Email unchanged
    ("en", "da", "www.kalundborg.dk", "www.kalundborg.dk", "edge_cases"),  # URL unchanged
    ("da", "en", "hej hej", "hello hello", "edge_cases"),  # Repeated words

    # === POLITENESS LEVELS ===
    ("en", "da", "Give me that", "Giv mig det", "politeness_casual"),
    ("en", "da", "Could you please give me that?", "Kunne du være sød at give mig det?", "politeness_formal"),
    ("da", "ar", "Tak for hjælpen", "شكرا للمساعدة", "politeness_gratitude"),

    # === ARABIC SPECIFIC TESTS ===
    ("ar", "da", "مرحبا", "hej", "arabic_danish"),
    ("ar", "da", "شكرا", "tak", "arabic_danish"),
    ("ar", "da", "أحتاج مساعدة", "jeg har brug for hjælp", "arabic_danish"),
    ("ar", "en", "مرحبا", "hello", "arabic_english"),
    ("ar", "en", "شكرا", "thank you", "arabic_english"),

    # === LONGER SENTENCES ===
    ("en", "da", "Good morning, I would like to schedule an appointment with a caseworker to discuss my housing benefit application.",
     "God morgen, jeg vil gerne bestille en tid hos en sagsbehandler for at diskutere min ansøgning om boligstøtte.", "complex_sentences"),

    ("da", "en", "Velkommen til Kalundborg Kommune. Hvordan kan vi hjælpe dig i dag?",
     "Welcome to Kalundborg Municipality. How can we help you today?", "complex_sentences"),

    ("da", "ar", "Du skal medbringe pas, cpr-kort og dokumentation for indkomst",
     "يجب أن تحضر جواز السفر وبطاقة CPR ووثائق الدخل", "complex_sentences"),
]

def get_test_cases_by_category(category=None, languages=None):
    """Filter test cases by category and/or language pair"""
    cases = TRANSLATION_TEST_CASES

    if category:
        cases = [c for c in cases if c[4] == category]

    if languages:
        source_lang, target_lang = languages
        cases = [c for c in cases if c[0] == source_lang and c[1] == target_lang]

    return cases

def get_all_categories():
    """Get all available test categories"""
    return list(set(case[4] for case in TRANSLATION_TEST_CASES))

def get_all_language_pairs():
    """Get all available language pairs"""
    return list(set((case[0], case[1]) for case in TRANSLATION_TEST_CASES))

# Quality assessment helpers
def calculate_similarity_score(expected, actual):
    """Check if translation was provided (not exact match scoring)"""
    actual_lower = actual.lower().strip()

    # Check if system refused to translate
    refusal_patterns = [
        "no translation",
        "ingen oversættelse",
        "cannot translate",
        "kan ikke oversætte",
        "unable to translate",
        "not able to translate",
        "translation not possible"
    ]

    # If it's a refusal, score as 0
    for pattern in refusal_patterns:
        if pattern in actual_lower:
            return 0

    # If it provided any translation attempt, score as 100
    # (Translation quality should be judged by humans, not algorithms)
    if len(actual.strip()) > 0:
        return 100

    return 0

def is_hallucination(input_text, output_text, expected_text):
    """Detect potential hallucinations"""
    # Check if output is much longer than expected (potential over-explanation)
    if len(output_text.split()) > len(expected_text.split()) * 2:
        return True

    # Check for common hallucination patterns
    hallucination_patterns = [
        "the user is saying",
        "this means",
        "the translation is",
        "in other words",
        "the person wants",
        "I understand that",
    ]

    output_lower = output_text.lower()
    return any(pattern in output_lower for pattern in hallucination_patterns)