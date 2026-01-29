"""
Translation Quality Testing API Routes

Endpoints for testing translation quality with different temperatures and prompts.
"""
import logging

from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
import time

logger = logging.getLogger(__name__)
# from concurrent.futures import ThreadPoolExecutor, as_completed  # Removed for Flask context compatibility
from typing import List, Dict, Any

from test_dataset import (
    TRANSLATION_TEST_CASES,
    get_test_cases_by_category,
    get_all_categories,
    get_all_language_pairs,
    calculate_similarity_score,
    is_hallucination
)
from services.translation_service import translate_text
# Authentication is handled globally by app.before_request in auth/auth.py

# Create namespace
api = Namespace('testing', description='Translation quality testing operations')

# API Models
test_case_model = api.model('TestCase', {
    'source_lang': fields.String(required=True, description='Source language code'),
    'target_lang': fields.String(required=True, description='Target language code'),
    'input_text': fields.String(required=True, description='Text to translate'),
    'expected': fields.String(required=True, description='Expected translation'),
    'category': fields.String(required=True, description='Test case category')
})

test_result_model = api.model('TestResult', {
    'input_text': fields.String(description='Original input'),
    'expected': fields.String(description='Expected translation'),
    'actual': fields.String(description='Actual translation'),
    'similarity_score': fields.Integer(description='Similarity score 0-100'),
    'is_hallucination': fields.Boolean(description='Whether output appears to be hallucination'),
    'execution_time_ms': fields.Integer(description='Time taken for translation'),
    'category': fields.String(description='Test case category')
})

batch_test_request = api.model('BatchTestRequest', {
    'temperatures': fields.List(fields.Float, description='List of temperatures to test (0.0-1.0)'),
    'model_key': fields.String(description='Translation model to use', default='gpt4o-mini'),
    'categories': fields.List(fields.String, description='Test categories to include (optional)'),
    'language_pairs': fields.List(fields.List(fields.String), description='Language pairs [[source,target]] (optional)'),
    'prompt_variations': fields.List(fields.String, description='Custom prompt variations to test (optional)')
})

prompt_test_request = api.model('PromptTestRequest', {
    'test_prompts': fields.List(fields.String, required=True, description='List of prompts to test'),
    'temperature': fields.Float(default=0.5, description='Temperature to use for all tests'),
    'model_key': fields.String(default='gpt4o-mini', description='Model to use'),
    'categories': fields.List(fields.String, description='Test categories (default: basic_words)')
})

batch_test_response = api.model('BatchTestResponse', {
    'test_summary': fields.Raw(description='Overall test results summary'),
    'detailed_results': fields.Raw(description='Detailed results by temperature/prompt'),
    'recommendations': fields.Raw(description='Recommended settings based on results')
})

@api.route('/test-cases')
class TestCases(Resource):
    @api.doc('get_test_cases')
    @api.marshal_list_with(test_case_model)
    def get(self):
        """Get all available test cases"""
        category = request.args.get('category')
        source_lang = request.args.get('source_lang')
        target_lang = request.args.get('target_lang')

        language_filter = (source_lang, target_lang) if source_lang and target_lang else None

        cases = get_test_cases_by_category(category, language_filter)

        return [{
            'source_lang': case[0],
            'target_lang': case[1],
            'input_text': case[2],
            'expected': case[3],
            'category': case[4]
        } for case in cases]

@api.route('/categories')
class TestCategories(Resource):
    @api.doc('get_categories')
    def get(self):
        """Get all available test categories"""
        return {
            'categories': get_all_categories(),
            'language_pairs': get_all_language_pairs()
        }

@api.route('/single-test')
class SingleTest(Resource):
    @api.doc('single_translation_test')
    @api.expect(api.model('SingleTestRequest', {
        'source_lang': fields.String(required=True),
        'target_lang': fields.String(required=True),
        'input_text': fields.String(required=True),
        'expected': fields.String(required=True),
        'temperature': fields.Float(default=0.2),
        'model_key': fields.String(default='gpt4o-mini')
    }))
    @api.marshal_with(test_result_model)
    def post(self):
        """Test a single translation with specific settings"""
        data = request.get_json()

        start_time = time.time()

        try:
            actual_translation = translate_text(
                original_text=data['input_text'],
                model_key=data.get('model_key', 'gpt4o-mini'),
                from_lang=data['source_lang'],
                to_lang=data['target_lang'],
                session_context=None,
                use_context_enhancement=True,
                override_temperature=data.get('temperature', 0.2)
            )

            execution_time = int((time.time() - start_time) * 1000)

            similarity = calculate_similarity_score(data['expected'], actual_translation)
            hallucination = is_hallucination(data['input_text'], actual_translation, data['expected'])

            return {
                'input_text': data['input_text'],
                'expected': data['expected'],
                'actual': actual_translation,
                'similarity_score': similarity,
                'is_hallucination': hallucination,
                'execution_time_ms': execution_time,
                'category': data.get('category', 'manual')
            }

        except Exception as e:
            return {
                'input_text': data['input_text'],
                'expected': data['expected'],
                'actual': f"ERROR: {str(e)}",
                'similarity_score': 0,
                'is_hallucination': True,
                'execution_time_ms': int((time.time() - start_time) * 1000),
                'category': data.get('category', 'manual')
            }

def run_single_test_case(case_data, temperature, model_key, prompt_variation=None):
    """Run a single test case with specified settings"""
    source_lang, target_lang, input_text, expected, category = case_data

    start_time = time.time()

    try:
        # TODO: If prompt_variation is provided, temporarily update system settings
        # For now, we'll use the current system prompt

        actual_translation = translate_text(
            original_text=input_text,
            model_key=model_key,
            from_lang=source_lang,
            to_lang=target_lang,
            session_context=None,
            use_context_enhancement=False,
            override_temperature=temperature
        )

        execution_time = int((time.time() - start_time) * 1000)

        return {
            'source_lang': source_lang,
            'target_lang': target_lang,
            'input_text': input_text,
            'expected': expected,
            'actual': actual_translation,
            'similarity_score': calculate_similarity_score(expected, actual_translation),
            'is_hallucination': is_hallucination(input_text, actual_translation, expected),
            'execution_time_ms': execution_time,
            'category': category,
            'temperature': temperature,
            'model_key': model_key
        }

    except Exception as e:
        return {
            'source_lang': source_lang,
            'target_lang': target_lang,
            'input_text': input_text,
            'expected': expected,
            'actual': f"ERROR: {str(e)}",
            'similarity_score': 0,
            'is_hallucination': True,
            'execution_time_ms': int((time.time() - start_time) * 1000),
            'category': category,
            'temperature': temperature,
            'model_key': model_key
        }

@api.route('/batch-test')
class BatchTest(Resource):
    @api.doc('batch_translation_test')
    @api.expect(batch_test_request)
    @api.marshal_with(batch_test_response)
    def post(self):
        """Run comprehensive batch testing with multiple temperatures and prompts"""
        data = request.get_json()

        temperatures = data.get('temperatures', [0.0, 0.1, 0.2, 0.3, 0.5, 0.7])
        model_key = data.get('model_key', 'gpt4o-mini')
        categories = data.get('categories', None)
        language_pairs = data.get('language_pairs', None)

        # Get test cases to run
        test_cases = []
        if categories:
            for category in categories:
                test_cases.extend(get_test_cases_by_category(category))
        else:
            test_cases = TRANSLATION_TEST_CASES

        if language_pairs:
            filtered_cases = []
            for lang_pair in language_pairs:
                source_lang, target_lang = lang_pair
                filtered_cases.extend([
                    case for case in test_cases
                    if case[0] == source_lang and case[1] == target_lang
                ])
            test_cases = filtered_cases

        logger.info("BATCH TEST: Running %d test cases with %d temperatures", len(test_cases), len(temperatures))

        # Run tests for each temperature
        all_results = []
        temperature_summaries = {}

        for temperature in temperatures:
            logger.info("BATCH TEST: Testing temperature %s", temperature)

            # Run all test cases for this temperature
            temp_results = []

            # Run test cases sequentially to avoid Flask context issues
            for case in test_cases:
                result = run_single_test_case(case, temperature, model_key)
                temp_results.append(result)
                all_results.append(result)

            # Calculate summary for this temperature
            avg_similarity = sum(r['similarity_score'] for r in temp_results) / len(temp_results)
            hallucination_rate = sum(1 for r in temp_results if r['is_hallucination']) / len(temp_results)
            avg_time = sum(r['execution_time_ms'] for r in temp_results) / len(temp_results)

            temperature_summaries[temperature] = {
                'avg_similarity_score': round(avg_similarity, 1),
                'hallucination_rate': round(hallucination_rate * 100, 1),
                'avg_execution_time_ms': round(avg_time, 0),
                'total_tests': len(temp_results),
                'perfect_matches': sum(1 for r in temp_results if r['similarity_score'] == 100),
                'errors': sum(1 for r in temp_results if 'ERROR:' in r['actual'])
            }

        # Find best temperature based on criteria
        best_temp = max(temperatures, key=lambda t: (
            temperature_summaries[t]['avg_similarity_score'] -
            temperature_summaries[t]['hallucination_rate'] * 2  # Penalize hallucinations heavily
        ))

        recommendations = {
            'recommended_temperature': best_temp,
            'reasoning': f"Temperature {best_temp} achieved {temperature_summaries[best_temp]['avg_similarity_score']}% avg similarity with {temperature_summaries[best_temp]['hallucination_rate']}% hallucination rate",
            'top_3_temperatures': sorted(
                temperatures,
                key=lambda t: temperature_summaries[t]['avg_similarity_score'],
                reverse=True
            )[:3]
        }

        return {
            'test_summary': {
                'total_test_cases': len(test_cases),
                'temperatures_tested': temperatures,
                'model_used': model_key,
                'categories_included': categories or 'all',
                'language_pairs_included': language_pairs or 'all'
            },
            'detailed_results': {
                'by_temperature': temperature_summaries,
                'all_individual_results': all_results[:50]  # Limit to first 50 for response size
            },
            'recommendations': recommendations
        }

@api.route('/prompt-test')
class PromptTest(Resource):
    @api.doc('test_prompts_comparison')
    @api.expect(prompt_test_request)
    def post(self):
        """Test different prompts against the same test cases"""
        from models.system_settings import SystemSettings
        data = request.get_json()

        test_prompts = data.get('test_prompts', [])
        temperature = data.get('temperature', 0.5)
        model_key = data.get('model_key', 'gpt4o-mini')
        categories = data.get('categories', ['basic_words'])

        if not test_prompts:
            return {'error': 'At least one test prompt is required'}, 400

        # Get test cases
        test_cases = []
        for category in categories:
            test_cases.extend(get_test_cases_by_category(category))

        if not test_cases:
            test_cases = get_test_cases_by_category('basic_words')  # Fallback

        logger.info("PROMPT TEST: Testing %d prompts with %d test cases", len(test_prompts), len(test_cases))

        # Store original prompt settings
        original_mode = None
        original_custom = None
        try:
            original_mode = SystemSettings.get_setting('translation_prompt_mode', 'default')
            original_custom = SystemSettings.get_setting('translation_prompt_custom', '')
        except:
            pass

        results = {}

        for i, prompt in enumerate(test_prompts):
            prompt_name = f"prompt_{i+1}"
            logger.info("PROMPT TEST: Testing %s", prompt_name)

            # Set custom prompt temporarily
            try:
                SystemSettings.set_setting('translation_prompt_mode', 'custom', 'text', 'Translation Prompt Mode')
                SystemSettings.set_setting('translation_prompt_custom', prompt, 'text', 'Custom Translation Prompt')
            except Exception as e:
                logger.warning("Could not set custom prompt: %s", e)

            # Run tests with this prompt
            prompt_results = []
            for case in test_cases:
                result = run_single_test_case(case, temperature, model_key)
                result['prompt_used'] = prompt_name
                prompt_results.append(result)

            # Calculate summary
            avg_similarity = sum(r['similarity_score'] for r in prompt_results) / len(prompt_results)
            hallucination_rate = sum(1 for r in prompt_results if r['is_hallucination']) / len(prompt_results)
            perfect_matches = sum(1 for r in prompt_results if r['similarity_score'] == 100)

            results[prompt_name] = {
                'prompt_text': prompt,
                'avg_similarity_score': round(avg_similarity, 1),
                'hallucination_rate': round(hallucination_rate * 100, 1),
                'perfect_matches': perfect_matches,
                'total_tests': len(prompt_results),
                'sample_results': prompt_results[:10]  # First 10 for review
            }

        # Restore original settings
        try:
            if original_mode:
                SystemSettings.set_setting('translation_prompt_mode', original_mode, 'text', 'Translation Prompt Mode')
            if original_custom:
                SystemSettings.set_setting('translation_prompt_custom', original_custom, 'text', 'Custom Translation Prompt')
        except:
            pass

        # Find best prompt
        best_prompt = max(results.keys(), key=lambda k: results[k]['avg_similarity_score'])

        return {
            'prompt_comparison': results,
            'best_prompt': best_prompt,
            'best_score': results[best_prompt]['avg_similarity_score'],
            'test_summary': {
                'total_prompts_tested': len(test_prompts),
                'test_cases_per_prompt': len(test_cases),
                'categories_tested': categories
            }
        }