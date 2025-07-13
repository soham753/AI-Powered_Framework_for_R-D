# product_analysis/urls.py

from django.urls import path
from .views import analyze_product_prices

urlpatterns = [
    path('', analyze_product_prices, name='analyze_product_prices'),
]
