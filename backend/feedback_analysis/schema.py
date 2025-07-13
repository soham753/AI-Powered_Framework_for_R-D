# feedback_analysis/schema.py

from pydantic import BaseModel
from typing import List, Optional, Dict, Union

class ProductInsights(BaseModel):
    product_summary: Optional[str]
    feedback_summary: Optional[str]
    advantages: Optional[List[str]]
    disadvantages: Optional[List[str]]
    areas_to_improve: Optional[List[str]]
    target_audience: Optional[List[str]]
    unique_selling_points: Optional[List[str]]
    notable_specifications: Optional[List[str]]
