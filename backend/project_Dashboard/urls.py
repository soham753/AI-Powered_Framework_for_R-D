from django.urls import path
from .views import get_project_details ,new_project_details

urlpatterns = [
    path('get_project_details/', get_project_details, name='get_project_details'),
    path('new_project_details/', new_project_details, name='new_project_details'), 
]