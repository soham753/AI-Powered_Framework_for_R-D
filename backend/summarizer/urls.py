from django.urls import path
from .views import summarize_pdf

urlpatterns = [
    path('', summarize_pdf, name='summarize_pdf'),
]
