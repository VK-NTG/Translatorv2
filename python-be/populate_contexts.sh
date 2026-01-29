#!/bin/bash

# Populate language contexts with rich cultural data via API
API_BASE="http://localhost:5001/api/v1"
ADMIN_SECRET="dev-bearer-kk-super-secret-api-key"

echo "🌍 Populating language contexts via API..."
echo "🌐 Target API: $API_BASE"
echo

created_count=0
updated_count=0

# Function to create or update a language context
create_or_update_context() {
    local language_code="$1"
    local language_name="$2"
    local formality_level="$3"
    local formality_notes="$4"
    local cultural_notes="$5"
    local system_prompt="$6"

    # Create JSON payload
    local json_data=$(cat <<EOF
{
    "language_code": "$language_code",
    "language_name": "$language_name",
    "formality_level": "$formality_level",
    "formality_notes": "$formality_notes",
    "cultural_notes": "$cultural_notes",
    "system_prompt": "$system_prompt"
}
EOF
)

    # Check if context exists
    local check_response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Content-Type: application/json" \
        -H "x-admin-secret: $ADMIN_SECRET" \
        "$API_BASE/context/language-contexts/$language_code")

    if [ "$check_response" = "200" ]; then
        # Update existing context
        local update_response=$(curl -s -w "%{http_code}" -o /dev/null \
            -X PUT \
            -H "Content-Type: application/json" \
            -H "x-admin-secret: $ADMIN_SECRET" \
            -d "$json_data" \
            "$API_BASE/context/language-contexts/$language_code")

        if [ "$update_response" = "200" ]; then
            echo "✅ Updated $language_code - $language_name"
            ((updated_count++))
        else
            echo "❌ Failed to update $language_code: HTTP $update_response"
        fi
    elif [ "$check_response" = "404" ]; then
        # Create new context
        local create_response=$(curl -s -w "%{http_code}" -o /dev/null \
            -X POST \
            -H "Content-Type: application/json" \
            -H "x-admin-secret: $ADMIN_SECRET" \
            -d "$json_data" \
            "$API_BASE/context/language-contexts")

        if [ "$create_response" = "201" ]; then
            echo "🆕 Created $language_code - $language_name"
            ((created_count++))
        else
            echo "❌ Failed to create $language_code: HTTP $create_response"
        fi
    else
        echo "❌ Error checking $language_code: HTTP $check_response"
    fi
}

# Danish (Denmark)
create_or_update_context "da-DK" "Danish (Denmark)" "formal" \
    "Danish municipal communication should be polite but direct. Use 'De' for formal address in official contexts, though 'du' is becoming more common. Avoid excessive politeness - Danes value efficiency and clarity." \
    "Danish communication values 'hygge' (coziness) and directness. Be clear and concise. Danes appreciate honesty over diplomatic language. Municipal services expect respectful but straightforward communication without unnecessary formality." \
    "When translating to/from Danish for municipal services: Use formal language ('De' for official documents, 'du' for casual), be direct and clear, use appropriate municipal terminology. Avoid overly flowery language - Danes prefer practical, efficient communication."

# Danish
create_or_update_context "da" "Danish" "formal" \
    "Same as da-DK - Use 'De' for formal address in official contexts. Danes value direct, honest communication over excessive politeness." \
    "Danish communication culture emphasizes directness, efficiency, and equality. Avoid hierarchical language - Danes prefer egalitarian communication styles." \
    "For Danish translations: Be direct and clear, use 'De' for formal contexts, avoid unnecessary complexity. Danish values practical, honest communication."

# English (US)
create_or_update_context "en-US" "English (United States)" "mixed" \
    "American English varies by context. Government/municipal: moderately formal but accessible. Use 'you' (no formal/informal distinction). Be professional but approachable." \
    "American communication tends to be direct but polite. Values clarity, accessibility, and customer service orientation. Municipal communications should be helpful and solution-focused." \
    "For American English: Use clear, accessible language. Be professional but friendly. Include helpful context and next steps. Avoid overly bureaucratic language - Americans prefer plain English."

# Dutch (Netherlands)
create_or_update_context "nl-NL" "Dutch (Netherlands)" "formal" \
    "Dutch uses 'u' for formal address in official contexts, 'je/jij' for informal. Municipal communications should use 'u'. Dutch directness is valued - be clear and to the point." \
    "Dutch communication is very direct and practical. Avoid beating around the bush - say what you mean clearly. Dutch people appreciate efficiency and honesty in municipal services." \
    "For Dutch translations: Use 'u' for formal address, be direct and practical, use clear terminology. Dutch values straightforward, honest communication without excessive politeness."

# Arabic (Egypt)
create_or_update_context "ar-EG" "Arabic (Egypt)" "very_formal" \
    "Arabic requires high formality in official contexts. Use respectful forms of address, include appropriate honorifics. Government communications should be very respectful and formal." \
    "Arabic communication in official contexts is elaborate and formal. Respect and courtesy are paramount. Include appropriate religious/cultural greetings. High-context culture - reading between the lines is important." \
    "For Arabic translations: Use highly formal and respectful language, include appropriate honorifics (حضرتك), maintain courteous tone throughout. Begin with greetings and show proper respect for the reader."

# Ukrainian
create_or_update_context "uk-UA" "Ukrainian (Ukraine)" "formal" \
    "Ukrainian uses 'Ви' for formal address in official contexts, 'ти' for informal. Government communications should maintain formal register and show respect for citizens." \
    "Ukrainian communication values respect and formality in official contexts. Be thorough and show consideration for the citizen's situation. Avoid overly bureaucratic language but maintain dignity." \
    "For Ukrainian translations: Use 'Ви' for formal address, maintain respectful tone, be thorough but clear. Ukrainian values proper respect in official communications."

# Albanian
create_or_update_context "sq-AL" "Albanian (Albania)" "formal" \
    "Albanian uses formal 'Ju' in official contexts. Government communications should be respectful and formal while remaining accessible to citizens." \
    "Albanian communication values respect and traditional courtesy in official settings. Be formal but not overly complex. Show proper respect for authority and civic responsibility." \
    "For Albanian translations: Use formal 'Ju' address, maintain respectful tone, be clear and accessible. Albanian values traditional courtesy in official communications."

# Hebrew
create_or_update_context "he-IL" "Hebrew (Israel)" "mixed" \
    "Hebrew has complex formality levels. Government communications typically use polite but direct language. Israeli culture values directness even in formal contexts." \
    "Israeli communication is characteristically direct and informal even in official contexts. Be clear and to the point. Israelis appreciate efficiency and straightforward communication." \
    "For Hebrew translations: Be direct but polite, use clear language, avoid unnecessary formality. Israeli culture values practical, efficient communication even in government contexts."

# Tamil
create_or_update_context "ta-IN" "Tamil (India)" "very_formal" \
    "Tamil has complex honorific systems. Government communications should use respectful forms appropriate to the context. Show proper respect for citizens and officials." \
    "Tamil communication in official contexts requires careful attention to respect levels and social hierarchy. Be formal and show appropriate deference while being helpful and clear." \
    "For Tamil translations: Use appropriate honorific levels, maintain very respectful tone, be thorough and clear. Tamil values proper respect and courtesy in official communications."

# Catalan
create_or_update_context "ca-ES" "Catalan (Spain)" "formal" \
    "Catalan uses 'vostè' for formal address in official contexts. Government communications should be formal but accessible, respecting Catalan linguistic identity." \
    "Catalan communication values linguistic pride and cultural identity. Be respectful of language choice and cultural significance. Formal but warm communication style is preferred." \
    "For Catalan translations: Use 'vostè' for formal address, respect linguistic identity, be formal but accessible. Catalan values cultural sensitivity and proper language use."

# Swedish
create_or_update_context "sv-SE" "Swedish (Sweden)" "mixed" \
    "Swedish traditionally used 'ni' for formal address, but 'du' is now common even in official contexts. Be polite but not overly formal - Swedes value egalitarian communication." \
    "Swedish communication emphasizes equality and consensus. Avoid hierarchical language. Be clear, helpful, and inclusive. Swedish society values accessibility and citizen participation." \
    "For Swedish translations: Use 'du' in most contexts (even official), be clear and egalitarian, avoid unnecessarily complex language. Swedish values accessible, inclusive communication."

# Polish
create_or_update_context "pl-PL" "Polish (Poland)" "formal" \
    "Polish uses complex politeness systems. Government communications should use formal 'Pan/Pani' address forms. Show appropriate respect while being helpful and clear." \
    "Polish communication values traditional courtesy and respect, especially in official contexts. Be thorough and show consideration for the citizen's dignity and concerns." \
    "For Polish translations: Use formal 'Pan/Pani' address, maintain respectful tone, be thorough and considerate. Polish values traditional courtesy and proper respect in official communications."

# German
create_or_update_context "de-DE" "German (Germany)" "very_formal" \
    "German requires 'Sie' in all official contexts. Government communications should be formal, thorough, and precise. Germans expect detailed, systematic information." \
    "German communication values precision, thoroughness, and systematic presentation. Be detailed and methodical. Germans appreciate comprehensive information and clear procedures." \
    "For German translations: Always use 'Sie' for formal address, be thorough and systematic, provide detailed information. German values precision, completeness, and methodical communication."

echo
echo "🎉 Population complete!"
echo "📊 Created: $created_count contexts"
echo "📊 Updated: $updated_count contexts"
echo "📊 Total processed: 13 contexts"
echo
echo "✨ All done! Your language contexts are now populated with rich cultural data."
echo "📱 Refresh your settings page to see the new cultural information."