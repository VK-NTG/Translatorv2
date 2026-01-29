#!/usr/bin/env python3
"""
Translation Quality Testing Script

Usage:
python test_translation_quality.py --temperature 0.2
python test_translation_quality.py --batch-test
python test_translation_quality.py --categories basic_words municipal_terms
"""

import requests
import json
import argparse
import time
from typing import List, Optional

API_BASE = "http://127.0.0.1:5001/api/v1"
API_KEY = "kk-super-secret-api-key"

def make_request(endpoint: str, method: str = "GET", data: dict = None):
    """Make API request with proper headers"""
    headers = {"x-api-key": API_KEY}
    if data:
        headers["Content-Type"] = "application/json"

    url = f"{API_BASE}{endpoint}"

    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")

    response.raise_for_status()
    return response.json()

def list_test_cases(category: Optional[str] = None, language_pair: Optional[tuple] = None):
    """List available test cases"""
    params = {}
    if category:
        params['category'] = category
    if language_pair:
        params['source_lang'] = language_pair[0]
        params['target_lang'] = language_pair[1]

    endpoint = "/testing/test-cases"
    if params:
        param_str = "&".join(f"{k}={v}" for k, v in params.items())
        endpoint += f"?{param_str}"

    return make_request(endpoint)

def get_categories_and_languages():
    """Get available categories and language pairs"""
    return make_request("/testing/categories")

def test_single_translation(source_lang: str, target_lang: str, input_text: str,
                          expected: str, temperature: float = 0.2, model_key: str = "gpt4o-mini"):
    """Test a single translation"""
    data = {
        "source_lang": source_lang,
        "target_lang": target_lang,
        "input_text": input_text,
        "expected": expected,
        "temperature": temperature,
        "model_key": model_key
    }

    return make_request("/testing/single-test", "POST", data)

def run_batch_test(temperatures: List[float], categories: Optional[List[str]] = None,
                   language_pairs: Optional[List[List[str]]] = None, model_key: str = "gpt4o-mini"):
    """Run comprehensive batch testing"""
    data = {
        "temperatures": temperatures,
        "model_key": model_key
    }

    if categories:
        data["categories"] = categories

    if language_pairs:
        data["language_pairs"] = language_pairs

    return make_request("/testing/batch-test", "POST", data)

def print_test_result(result: dict):
    """Pretty print a single test result"""
    print(f"{'='*60}")
    print(f"Input: {result['input_text']}")
    print(f"Expected: {result['expected']}")
    print(f"Actual: {result['actual']}")
    print(f"Similarity Score: {result['similarity_score']}%")
    print(f"Hallucination: {'Yes' if result['is_hallucination'] else 'No'}")
    print(f"Time: {result['execution_time_ms']}ms")
    print(f"Category: {result.get('category', 'N/A')}")

def print_batch_results(results: dict):
    """Pretty print batch test results"""
    print("=" * 80)
    print("BATCH TEST RESULTS")
    print("=" * 80)

    summary = results['test_summary']
    print(f"Total Test Cases: {summary['total_test_cases']}")
    print(f"Temperatures Tested: {summary['temperatures_tested']}")
    print(f"Model Used: {summary['model_used']}")
    print()

    print("RESULTS BY TEMPERATURE:")
    print("-" * 50)
    by_temp = results['detailed_results']['by_temperature']

    for temp in sorted(by_temp.keys()):
        data = by_temp[temp]
        print(f"Temperature {temp}:")
        print(f"  Avg Similarity: {data['avg_similarity_score']}%")
        print(f"  Hallucination Rate: {data['hallucination_rate']}%")
        print(f"  Perfect Matches: {data['perfect_matches']}")
        print(f"  Avg Time: {data['avg_execution_time_ms']}ms")
        print(f"  Errors: {data['errors']}")
        print()

    rec = results['recommendations']
    print("RECOMMENDATIONS:")
    print(f"  Best Temperature: {rec['recommended_temperature']}")
    print(f"  Reasoning: {rec['reasoning']}")
    print(f"  Top 3 Temperatures: {rec['top_3_temperatures']}")

def main():
    parser = argparse.ArgumentParser(description="Test translation quality")
    parser.add_argument("--temperature", type=float, help="Test single temperature")
    parser.add_argument("--batch-test", action="store_true", help="Run comprehensive batch test")
    parser.add_argument("--categories", nargs="+", help="Test specific categories")
    parser.add_argument("--language-pairs", nargs="+", help="Test specific language pairs (format: en-da ar-da)")
    parser.add_argument("--list-categories", action="store_true", help="List available categories")
    parser.add_argument("--list-cases", action="store_true", help="List all test cases")
    parser.add_argument("--model", default="gpt4o-mini", help="Model to use for testing")

    args = parser.parse_args()

    try:
        if args.list_categories:
            data = get_categories_and_languages()
            print("Available Categories:", data['categories'])
            print("Available Language Pairs:", data['language_pairs'])
            return

        if args.list_cases:
            cases = list_test_cases()
            for case in cases:
                print(f"{case['source_lang']}->{case['target_lang']}: '{case['input_text']}' -> '{case['expected']}' [{case['category']}]")
            return

        if args.batch_test:
            print("Starting comprehensive batch test...")

            # Test range of temperatures
            temperatures = [0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0]

            # Parse language pairs if provided
            language_pairs = None
            if args.language_pairs:
                language_pairs = []
                for pair in args.language_pairs:
                    source, target = pair.split('-')
                    language_pairs.append([source, target])

            results = run_batch_test(
                temperatures=temperatures,
                categories=args.categories,
                language_pairs=language_pairs,
                model_key=args.model
            )

            print_batch_results(results)
            return

        if args.temperature is not None:
            print(f"Testing with temperature {args.temperature}")

            # Get some sample test cases
            cases = list_test_cases()

            if args.categories:
                cases = [c for c in cases if c['category'] in args.categories]

            # Test first 10 cases
            for case in cases[:10]:
                result = test_single_translation(
                    source_lang=case['source_lang'],
                    target_lang=case['target_lang'],
                    input_text=case['input_text'],
                    expected=case['expected'],
                    temperature=args.temperature,
                    model_key=args.model
                )
                print_test_result(result)
                time.sleep(0.5)  # Be nice to the API
            return

        # Default: show help
        parser.print_help()

    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        print("Make sure the backend is running on http://127.0.0.1:5001")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()