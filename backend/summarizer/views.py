# # summarizer/views.py

# import os
# import tempfile
# import logging
# import re
# import json
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.views.decorators.http import require_POST
# from PyPDF2 import PdfReader
# from langchain.schema import HumanMessage
# from .apps import SummarizerConfig
# from .schema import example_paper_summary  # Make sure it's imported

# logger = logging.getLogger(__name__)

# @csrf_exempt
# @require_POST
# def summarize_pdf(request):
#     if 'pdf' not in request.FILES:
#         return JsonResponse({'error': 'No PDF file provided'}, status=400)

#     uploaded_file = request.FILES['pdf']
#     temp_path = None

#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
#             for chunk in uploaded_file.chunks():
#                 temp_file.write(chunk)
#             temp_path = temp_file.name

#         # Extract and clean text
#         logger.info("📥 Extracting text from PDF...")
#         paper_text = ""
#         reader = PdfReader(temp_path)
#         for page in reader.pages:
#             text = page.extract_text()
#             if text:
#                 paper_text += text.strip() + "\n"

#         paper_text = re.sub(r'\s+', ' ', paper_text).strip()[:7000]

#         if not paper_text:
#             logger.warning("❌ No text extracted from PDF")
#             return JsonResponse({
#                 'error': 'No text could be extracted. PDF may be scanned or encrypted.'
#             }, status=400)

#         # Use preloaded Ollama model
#         llm = SummarizerConfig.get_llm()
#         if not llm:
#             logger.error("LLM not initialized")
#             return JsonResponse({'error': 'Service unavailable. Please try again later.'}, status=503)

#         # Construct prompt
#         prompt = f"""
# You are an expert technical summarizer.

# Your task is to generate a summary of the following scientific or technical paper as a **pure JSON object**.

# The paper content is provided below:
# <task_paper>
# {paper_text}

# </task_paper>

# Use the following JSON format as an exact schema reference:
# <example>
# {example_paper_summary.model_dump_json(indent=4)}
# </example>

# Instructions:
# - Output must be a **valid JSON object only** — do NOT include markdown, extra text, or code fences.
# - The JSON should follow the structure shown in the example.
# - Not write any additional text outside the JSON object.
# - Replace the example content with accurate, concise information extracted from the paper.
# - Do not wrap or label your output in any way — return only the JSON.
# """

#         logger.info("🧠 Sending prompt to Ollama...")
#         response = llm.invoke([HumanMessage(content=prompt)])
#         summary = response.content.strip()
#         print(f"LLM response: {summary}")

#         # Validate the response is valid JSON
#         try:
#             json.loads(summary)  # Validate it's parseable JSON
#             logger.info("✅ Valid JSON summary received from LLM")
#             return JsonResponse({
#                 'status': 'success',
#                 'summary': json.loads(summary),  # Return parsed JSON
#                 'text_length': len(paper_text)
#             })
#         except json.JSONDecodeError as e:
#             logger.error(f"Invalid JSON response from LLM: {str(e)}")
#             return JsonResponse({
#                 'error': 'The summary could not be properly formatted.',
#                 'raw_response': summary
#             }, status=500)

#     except Exception as e:
#         logger.error(f"Unexpected error: {str(e)}", exc_info=True)
#         return JsonResponse({
#             'error': 'An unexpected error occurred during processing',
#             'details': str(e)
#         }, status=500)

#     finally:
#         if temp_path and os.path.exists(temp_path):
#             try:
#                 os.unlink(temp_path)
#             except Exception as e:
#                 logger.error(f"Error deleting temp file: {str(e)}")





# summarizer/views.py

import os
import tempfile
import logging
import re
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from PyPDF2 import PdfReader
from langchain.schema import HumanMessage
from .apps import SummarizerConfig
from .schema import example_paper_summary

logger = logging.getLogger(__name__)

def extract_json_from_response(llm_response: str) -> dict:
    """Extract JSON from LLM response that might contain extra text"""
    try:
        # First try to parse directly in case it's pure JSON
        return json.loads(llm_response)
    except json.JSONDecodeError:
        # If that fails, try to extract JSON from the text
        try:
            json_match = re.search(r'\{[\s\S]*\}', llm_response)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError("No valid JSON found in response")
        except Exception as e:
            logger.error(f"JSON extraction failed: {str(e)}")
            raise

@csrf_exempt
@require_POST
def summarize_pdf(request):
    if 'pdf' not in request.FILES:
        return JsonResponse({'error': 'No PDF file provided'}, status=400)

    uploaded_file = request.FILES['pdf']
    temp_path = None

    try:
        # File handling and text extraction
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        paper_text = ""
        reader = PdfReader(temp_path)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                paper_text += text.strip() + "\n"

        paper_text = re.sub(r'\s+', ' ', paper_text).strip()[:7000]

        if not paper_text:
            return JsonResponse({
                'error': 'No text could be extracted. PDF may be scanned or encrypted.'
            }, status=400)

        # LLM processing
        llm = SummarizerConfig.get_llm()
        if not llm:
            return JsonResponse({'error': 'Service unavailable'}, status=503)

        prompt = f"""
You are an expert technical summarizer.

Your task is to generate a summary of the following scientific or technical paper as a **pure JSON object**.

The paper content is provided below:
<task_paper>
{paper_text}

</task_paper>

Use the following JSON format as an exact schema reference:
<example>
{example_paper_summary.model_dump_json(indent=4)}
</example>

Instructions:
- Output must be a **valid JSON object only** — do NOT include markdown, extra text, or code fences.
- The JSON should follow the structure shown in the example.
- Do not write any additional text outside the JSON object.
- Replace the example content with accurate, concise information extracted from the paper.
- Do not wrap or label your output in any way — return only the JSON.
"""

        logger.info("Sending prompt to LLM...")
        response = llm.invoke([HumanMessage(content=prompt)])
        summary = response.content.strip()

        # Handle the response
        try:
            summary_json = extract_json_from_response(summary)
            return JsonResponse({
                'status': 'success',
                'summary': summary_json,
                'text_length': len(paper_text)
            })
        except Exception as e:
            logger.error(f"Failed to process LLM response: {str(e)}\nRaw response: {summary}")
            return JsonResponse({
                'error': 'Failed to process the summary response',
                'details': str(e),
                'raw_response': summary
            }, status=500)

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': 'An unexpected error occurred',
            'details': str(e)
        }, status=500)

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.error(f"Error deleting temp file: {str(e)}")