from django.urls import path
from .views import analyze_product_view

urlpatterns = [
    path("", analyze_product_view ,name='analyze_product_view'),
]