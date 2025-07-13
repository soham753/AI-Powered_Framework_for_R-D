import json
import re
import logging
import requests
from bs4 import BeautifulSoup
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from langchain.schema import HumanMessage
from summarizer.apps import SummarizerConfig
from .schema import ProductInsights
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)


ua = UserAgent()

def get_clean_webpage_text(url: str) -> str:
    headers = {
        "User-Agent": ua.random,  # rotating realistic User-Agent
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,"
            "application/signed-exchange;v=b3;q=0.9"
        ),
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
    }

    skip_keywords = {
        "Sign in", "Sponsored", "Start Again",
        "Please select", "Date of the price", "Get it by", "Back to top", "Interest-Based Ads", "Your Account", "Returns Centre",
        "Sell on Amazon", "Recently viewed", "Browsing history", "Amazon Music",
        "Shop the Store", "Similar Brands", "Add to cart", "Customer ratings", "Show more"
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 429:
            logger.warning(f"⚠️ Rate limited (429) from {url}")
            return "RATE_LIMITED"
        elif res.status_code != 200:
            logger.warning(f"❌ Non-200 status from URL {url}: {res.status_code}")
            return ""

        soup = BeautifulSoup(res.text, "html.parser")
        for tag in soup(["script", "style", "noscript", "footer", "nav", "svg"]):
            tag.decompose()

        raw_text = soup.get_text(separator="\n")
        lines = raw_text.splitlines()
        cleaned = [
            line.strip() for line in lines
            if line.strip() and not any(skip.lower() in line.lower() for skip in skip_keywords)
        ]

        return "\n".join(cleaned)

    except Exception as e:
        logger.error(f"❌ Error during scraping: {str(e)}")
        return ""

def extract_json_from_response(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                return json.loads(match.group())
        except Exception as e:
            logger.error(f"Failed to extract valid JSON: {e}")
    raise ValueError("LLM output was not valid JSON")


def get_product_insights_from_text(raw_text: str) -> dict:
    example = ProductInsights(
    product_summary="Premium wireless earbuds with active noise cancellation, spatial audio, and sweat resistance. Features 6hr battery life and MagSafe charging.",
    feedback_summary="Users love the noise cancellation and sound quality. Some report fit issues and high price.",
    advantages=[
        "Excellent noise cancellation",
        "Great sound quality",
        "Sweat/water resistant",
        "Seamless Apple ecosystem integration"
    ],
    disadvantages=[
        "Expensive",
        "May not fit all ear types",
        "Battery life could be better"
    ],
    areas_to_improve=[
        "Include more ear tip sizes",
        "Improve battery life",
        "Lower price point"
    ],
    target_audience=[
        "Apple users",
        "Audiophiles",
        "Frequent travelers",
        "Professionals"
    ],
    unique_selling_points=[
        "Active Noise Cancellation",
        "Spatial Audio",
        "H2 chip for better performance"
    ],
    notable_specifications=[
        "Bluetooth 5.3",
        "IPX4 rating",
        "MagSafe charging",
        "6hr playtime (ANC on)"
    ]
)

    prompt = f"""
You are a product research analyst AI.

Your task is to analyze and summarize the following **product page content**. Return your response as a **pure JSON object only**.

<product_page>
{raw_text}
</product_page>

Use the following schema structure for your JSON output:
<example>
{example.model_dump_json(indent=4)}
</example>

Instructions:
- Output must be a **valid JSON object only**.
- Follow the format shown in the example exactly.
- Do not include markdown, explanation, or code fences — output the JSON object directly.
- Replace the example values with insights inferred from the product content.
- If any field is not applicable or not found, set it as `null`.
"""

    try:
        llm = SummarizerConfig.get_llm()
        if not llm:
            raise RuntimeError("Ollama LLM is not initialized.")

        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()

        parsed = extract_json_from_response(content)
        validated = ProductInsights(**parsed)
        return validated.model_dump()
    except Exception as e:
        logger.error(f"❌ get_product_insights_from_text failed: {str(e)}")
        return {"error": "LLM processing or validation failed", "details": str(e)}


@csrf_exempt
@require_POST
def analyze_product_view(request):
    try:
        data = json.loads(request.body)
        url = data.get("url")
        if url:
            print("url get")
        if not url:
            return JsonResponse({"error": "Missing 'url' in request"}, status=400)

        logger.info(f"Fetching product page from URL: {url}")
        cleaned_text = get_clean_webpage_text(url)

        if not cleaned_text:
            return JsonResponse({"error": "Could not extract clean content from the webpage."}, status=500)

        insights = get_product_insights_from_text(cleaned_text)
        return JsonResponse(insights, json_dumps_params={"indent": 2, "ensure_ascii": False})

    except Exception as e:
        logger.exception("❌ Unexpected exception in analyze_product_view")
        return JsonResponse({"error": "Internal server error", "details": str(e)}, status=500)
