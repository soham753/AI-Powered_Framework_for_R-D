from django.urls import path
from .views import (
    create_note,
    create_product,
    get_notes_and_products_by_project,
    delete_note_by_id,
    delete_product_by_id,
    edit_product,
    edit_note,
    get_products_data,
    get_project_notes_with_summary
    
)

urlpatterns = [
    # Create endpoints
    path('create_note/', create_note, name='create_note'),
    path('create_product/', create_product, name='create_product'),

    # Fetch both notes and products for a project
    path('get_project_data/', get_notes_and_products_by_project, name='get_project_data'),
    path('get_products_data/',get_products_data, name='get_products_data'),
    path('get_summary/',get_project_notes_with_summary, name='get_project_notes_with_summary'),

    # Delete endpoints via POST
    path('delete_note/', delete_note_by_id, name='delete_note_by_id'),
    path('delete_product/', delete_product_by_id, name='delete_product_by_id'),
    path('edit_product/', edit_product, name='edit_product'),
    path('edit_note/', edit_note, name='edit_note'),
]
