#!/usr/bin/env python3
"""
Test script to compare simple vs complex prompts
"""

import requests
import json

API_BASE = "http://127.0.0.1:5001/api/v1"
API_KEY = "kk-super-secret-api-key"

def make_request(endpoint, method="GET", data=None):
    headers = {"x-api-key": API_KEY}
    if data:
        headers["Content-Type"] = "application/json"

    url = f"{API_BASE}{endpoint}"
    response = requests.post(url, headers=headers, json=data) if method == "POST" else requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# Test cases for comparison
test_cases = [
    ("en", "da", "hello", "hej"),
    ("en", "da", "please", "tak"),  # Context dependent
    ("en", "da", "thank you", "tak"),
    ("da", "en", "tilbud", "service"),  # Municipal context
    ("en", "da", "test", "test"),
]

# Test with current complex prompt
print("=== TESTING CURRENT COMPLEX PROMPT ===")
complex_results = []
for source, target, input_text, expected in test_cases:
    result = make_request("/testing/single-test", "POST", {
        "source_lang": source,
        "target_lang": target,
        "input_text": input_text,
        "expected": expected,
        "temperature": 0.5
    })
    complex_results.append(result)
    print(f"{input_text} -> {result['actual']} (expected: {expected}) - {result['similarity_score']}%")

print(f"\nComplex prompt average: {sum(r['similarity_score'] for r in complex_results) / len(complex_results):.1f}%")
print(f"Perfect matches: {sum(1 for r in complex_results if r['similarity_score'] == 100)}/{len(complex_results)}")

print("\n" + "="*60)
print("RECOMMEND: Create API endpoint to test with simple prompt like:")
print("'Translate from {source_lang} to {target_lang}: {text}'")
print("This would help isolate whether complexity is reducing accuracy.")