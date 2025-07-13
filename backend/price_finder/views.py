from django.http import JsonResponse
from rest_framework.decorators import api_view
import requests
from bs4 import BeautifulSoup
import random
import time
import re
import json
import logging
from typing import Dict
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage
from pydantic import BaseModel, ValidationError

# Set up logging
logger = logging.getLogger(__name__)

# ======= Pydantic models =======
class KeyDetail(BaseModel):
    avg_price: float
    price_range_low: float
    price_range_high: float

class PriceSummary(BaseModel):
    amazon: Dict[str, float]
    flipkart: Dict[str, float]
    robu: Dict[str, float]
    indiamart: Dict[str, float]
    alibaba: Dict[str, float]
    keydetail: KeyDetail

# ======= USER AGENTS =======
USER_AGENTS = [
    # Windows - Chrome
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Safari/537.36",
    
    # Windows - Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    
    # macOS - Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
    
    # macOS - Chrome
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Safari/537.36",

    # Linux - Chrome
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Safari/537.36",
    
    # Linux - Firefox
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    
    # Android - Chrome Mobile
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Mobile Safari/537.36",
    
    # iPhone - Safari
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",

    # Edge on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Safari/537.36 Edg/124.0.2478.51"
]


# ======= Helper Functions =======
def get_cleaned_text(url: str) -> str:
    try:
        headers = {
    "User-Agent": random.choice(USER_AGENTS),
    "Referer": "https://www.google.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0"
}

        time.sleep(random.uniform(1.5, 3.5))
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "noscript", "footer", "nav"]):
            tag.decompose()
            
        return "\n".join(
            [line.strip() for line in soup.get_text(separator="\n").splitlines() 
             if line.strip()]
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed for {url}: {str(e)}")
        return ""
    except Exception as e:
        logger.error(f"Error processing {url}: {str(e)}")
        return ""

def extract_esp32_products(raw_text: str, product: str) -> str:
    try:
        lines = raw_text.splitlines()
        results = []
        price_pattern = re.compile(r"(₹\s*\d+[,.]?\d*|\$\s*\d+(\.\d+)?(-\d+(\.\d+)?)?)")
        skip_keywords = {"account", "cart", "sort", "brands", "returns", "sponsored", "footer"}

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line or any(k in line.lower() for k in skip_keywords):
                i += 1
                continue
            if product.lower() in line.lower():
                title = line
                for j in range(i+1, len(lines)):
                    next_line = lines[j].strip()
                    if price_pattern.match(next_line):
                        results.append(f"{title}\n{next_line}")
                        i = j
                        break
                else:
                    i += 1
            else:
                i += 1
        return "\n\n".join(results)
    except Exception as e:
        logger.error(f"Error extracting products: {str(e)}")
        return ""

def extract_robu_products(text: str, product: str) -> str:
    try:
        lines = [line.strip() for line in text.splitlines()]
        keep_lines = []
        skip = False
        skip_words = {"cart", "login", "price", "sort", "terms", "review", "faq", "footer"}
        
        for i in range(len(lines)):
            if skip:
                skip = False
                continue
            line = lines[i]
            if not line or any(word in line.lower() for word in skip_words):
                continue
            if "₹" in line:
                next_line = lines[i + 1] if i + 1 < len(lines) else ""
                keep_lines.append(f"{line} {next_line}".strip())
                skip = True
            elif product.lower() in line.lower():
                keep_lines.append(line)
                if i + 1 < len(lines) and lines[i + 1] == line:
                    skip = True
        return "\n".join(keep_lines)
    except Exception as e:
        logger.error(f"Error extracting robu products: {str(e)}")
        return ""

def remove_consecutive_duplicates(text: str) -> str:
    try:
        lines = text.splitlines()
        return "\n".join([lines[i] for i in range(len(lines)) if i == 0 or lines[i] != lines[i - 1]])
    except Exception as e:
        logger.error(f"Error removing duplicates: {str(e)}")
        return text

def convert_result_to_json(raw_result_text: str) -> PriceSummary:
    try:
        start_idx = raw_result_text.find('{')
        end_idx = raw_result_text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            raise ValueError("No JSON found in response")
            
        raw_json_str = raw_result_text[start_idx:end_idx + 1]
        parsed_data = json.loads(raw_json_str)
        
        all_prices = []
        for site in ['amazon', 'flipkart', 'robu', 'indiamart', 'alibaba']:
            for name, price in parsed_data.get(site, {}).items():
                if isinstance(price, (int, float)):
                    all_prices.append(price)

        if not all_prices:
            raise ValueError("No valid prices found in the response")

        avg_price = round(sum(all_prices) / len(all_prices), 2)
        min_price = min(all_prices)
        max_price = max(all_prices)

        return PriceSummary(
            amazon=parsed_data.get("amazon", {}),
            flipkart=parsed_data.get("flipkart", {}),
            robu=parsed_data.get("robu", {}),
            indiamart=parsed_data.get("indiamart", {}),
            alibaba=parsed_data.get("alibaba", {}),
            keydetail=KeyDetail(
                avg_price=avg_price,
                price_range_low=min_price,
                price_range_high=max_price
            )
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        raise ValueError(f"Invalid JSON format: {str(e)}")
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise ValueError(f"Data validation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in conversion: {str(e)}")
        raise ValueError(f"Failed to parse result: {str(e)}")

# ======= MAIN API =======
@api_view(["POST"])
def analyze_product_prices(request):
    try:
        # Validate input data
        try:
            product = request.data.get("product", "").strip()
            selected_sites = request.data.get("sites", [])
            
            if not product:
                return JsonResponse(
                    {"error": "Product name is required"}, 
                    status=400
                )
                
            if not isinstance(selected_sites, list) or not selected_sites:
                return JsonResponse(
                    {"error": "At least one site is required"}, 
                    status=400
                )
                
        except Exception as e:
            logger.error(f"Input validation error: {str(e)}")
            return JsonResponse(
                {"error": "Invalid input format"}, 
                status=400
            )

        # Prepare URLs
        try:
            formatted_product = product.replace(" ", "+")
            all_possible_urls = {
                "amazon": f"https://www.amazon.in/s?k={formatted_product}",
                "flipkart": f"https://www.flipkart.com/search?q={formatted_product}",
                "alibaba": f"https://www.alibaba.com/trade/search?spm=a2700.product_home_newuser.home_new_user_first_screen_fy23_pc_search_bar.keydown__Enter&tab=all&SearchText={formatted_product}",
                "indiamart": f"https://dir.indiamart.com/search.mp?ss={formatted_product}",
                "robu": f"https://robu.in/?s={formatted_product}&post_type=product&dgwt_wcas=1"
            }

            site_keys = [site.lower() for site in selected_sites]
            url_map = {site: all_possible_urls[site] for site in site_keys if site in all_possible_urls}
            
            if not url_map:
                return JsonResponse(
                    {"error": "No valid sites selected"}, 
                    status=400
                )
                
        except Exception as e:
            logger.error(f"URL preparation error: {str(e)}")
            return JsonResponse(
                {"error": "Error preparing site URLs"}, 
                status=500
            )

        # Scrape and process data
        compiled_prompt_data = []
        for site in site_keys:
            try:
                site_url = url_map.get(site)
                if not site_url:
                    continue
                    
                raw_text = get_cleaned_text(site_url)
                if not raw_text:
                    continue
                    
                if site == "robu":
                    filtered = extract_robu_products(raw_text, product)
                    filtered = remove_consecutive_duplicates(filtered)
                else:
                    filtered = extract_esp32_products(raw_text, product)
                    
                if filtered:
                    compiled_prompt_data.append(f"{site.capitalize()}:\n{filtered}")
                    
            except Exception as e:
                logger.error(f"Error processing {site}: {str(e)}")
                continue

        if not compiled_prompt_data:
            return JsonResponse(
                {"error": "No data could be scraped from the selected sites."}, 
                status=400
            )

        full_scraped_info = "\n\n".join(compiled_prompt_data)

        # Generate response with LLM
        try:
            ollama = ChatOllama(model="llama3")
            
            example_summary = PriceSummary(
                amazon={
                    "AmericanElm 6 Pieces Birch Plywood": 999.0,
                    "Crafto Laser Cut Birch Wood Pack": 1049.0,
                    "SainSmart 3mm Birch Sheets (6 Pack)": 1199.0,
                    "WoodPecker Baltic Birch Ply Set": 949.0,
                    "PlyFun 6-Piece Birch Craft Board": 1090.0
                },
                flipkart={
                    "AmericanElm 6 Pcs Birch Wood Sheets": 899.0,
                    "LaserCraft Birch Sheet Pack of 6": 970.0,
                    "Premium Plywood Sheets for DIY": 1125.0,
                    "Birch Wood 3mm - 6 PCS (Craft Box)": 875.0,
                    "GlowForge Ready Birch Ply Boards": 1025.0
                },
                robu={
                    "Laser Grade Birch Ply Pack of 6": 1050.0,
                    "Robu Birch 12x12 Craft Sheet (6 Pack)": 980.0,
                    "Robu DIY Birch Plywood 3mm Sheets": 1035.0,
                    "Mini Birch Ply Panel Set – 6 PCS": 1100.0,
                    "Robu CNC Ready Birch Board Pack": 1015.0
                },
                indiamart={
                    "6 Piece Birch Plywood Set AmericanElm": 950.0,
                    "IndiaMart Craft Birch Ply (6 Sheets)": 1090.0,
                    "Birch 12 Inch Plywood Craft Set": 1020.0,
                    "Baltic Birch Ply 6x6 - 5 Pack": 875.0,
                    "DIY Birch Wood Laser Sheet Kit": 990.0
                },
                alibaba={
                    "Birch Plywood Sheet 3mm": 880.0,
                    "Craft Grade Birch Ply 12x12": 910.0,
                    "DIY Plywood Panels": 920.0,
                    "Premium Laser Cut Birch Sheets": 950.0,
                    "6 PCS Russian Birch Plywood": 890.0
                },
                keydetail=KeyDetail(
                    avg_price=994.4,
                    price_range_low=875.0,
                    price_range_high=1199.0
                )
            )

            prompt = f"""
You are a product intelligence assistant.
Your task is to analyze raw e-commerce scraped data and convert it into a structured JSON format that summarizes product names and prices by platform.

The product being analyzed is:
<product_name>
{product}
</product_name>

Return the result in the following JSON format:
<example>
{example_summary.model_dump_json(indent=4)}
</example>

Only return a valid JSON object. No explanation.

<scraped_data>
{full_scraped_info}
</scraped_data>
"""

            response = ollama.invoke([HumanMessage(content=prompt)])
            response_content = response.content
            
            # First try to parse as direct JSON
            try:
                parsed_json = json.loads(response_content)
                # Validate the parsed JSON matches our expected structure
                try:
                    price_summary = PriceSummary(**parsed_json)
                    return JsonResponse(price_summary.model_dump(), status=200)
                except ValidationError as ve:
                    logger.warning(f"Direct JSON validation failed, attempting conversion: {str(ve)}")
                    # Fall through to conversion attempt
            except json.JSONDecodeError:
                logger.warning("Response was not direct JSON, attempting conversion")
                # Fall through to conversion attempt
            
            # If direct parsing failed, try conversion
            try:
                parsed = convert_result_to_json(response_content)
                return JsonResponse(parsed.model_dump(), status=200)
            except ValueError as e:
                logger.error(f"Result parsing error: {str(e)}")
                return JsonResponse(
                    {"error": "Failed to parse LLM response", "details": str(e)},
                    status=500
                )
                
        except Exception as e:
            logger.error(f"LLM processing error: {str(e)}")
            return JsonResponse(
                {"error": "Error processing with LLM"}, 
                status=500
            )

    except Exception as e:
        logger.error(f"Unexpected error in API: {str(e)}", exc_info=True)
        return JsonResponse(
            {"error": "Internal server error"}, 
            status=500
        )