from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from datetime import datetime
from .models import Product, Note
from project_Dashboard.models import Project
from django.http import JsonResponse
from langchain_community.llms import Ollama
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document
from langchain.schema import HumanMessage

import logging
from summarizer.apps import SummarizerConfig


logger = logging.getLogger(__name__)

def is_valid_object_id(oid):
    return ObjectId.is_valid(oid)


@api_view(['POST'])
def create_product(request):
    data = request.data
    name = data.get("name")
    price = data.get("price")
    project_id = data.get("project_id")

    if not all([name, price, project_id]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(project_id):
        return Response({"error": "Invalid project_id"}, status=status.HTTP_400_BAD_REQUEST)

    project = Project.objects(id=ObjectId(project_id)).first()
    if not project:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    product = Product(name=name, price=price, project=project)
    product.save()

    return Response({"message": "Product created", "id": str(product.id)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def create_note(request):
    data = request.data
    title = data.get("title")
    content = data.get("content")
    project_id = data.get("project_id")

    if not all([title, content, project_id]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(project_id):
        return Response({"error": "Invalid project_id"}, status=status.HTTP_400_BAD_REQUEST)

    project = Project.objects(id=ObjectId(project_id)).first()
    if not project:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    note = Note(title=title, content=content, project=project, created_at=datetime.utcnow(), last_accessed=datetime.utcnow())
    note.save()

    return Response({"message": "Note created", "id": str(note.id)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def get_notes_and_products_by_project(request):
    project_id = request.data.get("project_id")
    if not project_id:
        return Response({"error": "Missing project_id"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(project_id):
        return Response({"error": "Invalid project_id"}, status=status.HTTP_400_BAD_REQUEST)

    project = Project.objects(id=ObjectId(project_id)).first()
    if not project:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    notes = Note.objects(project=project).order_by('-created_at')
    note_list = [
        {
            "id": str(note.id),
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at.isoformat(),
            "last_accessed": note.last_accessed.isoformat()
        }
        for note in notes
    ]

    products = Product.objects(project=project).order_by('-created_at')
    product_list = [
        {
            "id": str(product.id),
            "name": product.name,
            "price": product.price
        }
        for product in products
    ]

    return Response({
        "project_id": project_id,
        "notes": note_list,
        "products": product_list
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def delete_note_by_id(request):
    note_id = request.data.get("note_id")
    if not note_id:
        return Response({"error": "Missing note_id"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(note_id):
        return Response({"error": "Invalid note_id"}, status=status.HTTP_400_BAD_REQUEST)

    note = Note.objects(id=ObjectId(note_id)).first()
    if not note:
        return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

    note.delete()
    return Response({"message": "Note deleted successfully"}, status=status.HTTP_200_OK)


@api_view(['POST'])
def delete_product_by_id(request):
    product_id = request.data.get("product_id")
    if not product_id:
        return Response({"error": "Missing product_id"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(product_id):
        return Response({"error": "Invalid product_id"}, status=status.HTTP_400_BAD_REQUEST)

    product = Product.objects(id=ObjectId(product_id)).first()
    if not product:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    product.delete()
    return Response({"message": "Product deleted successfully"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def edit_note(request):
    """
    Edit a Note by its ID (title and content required).
    Expected JSON:
    {
        "note_id": "<note_id>",
        "title": "Updated title",
        "content": "Updated content"
    }
    """
    data = request.data
    note_id = data.get("note_id")
    title = data.get("title")
    content = data.get("content")

    # Validate required fields
    if not all([note_id, title, content]):
        return Response({"error": "Missing note_id, title, or content"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(note_id):
        return Response({"error": "Invalid note_id"}, status=status.HTTP_400_BAD_REQUEST)

    note = Note.objects(id=ObjectId(note_id)).first()
    if not note:
        return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

    # Update both title and content
    note.title = title
    note.content = content
    note.last_accessed = datetime.utcnow()
    note.save()

    return Response({"message": "Note updated successfully"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def edit_product(request):
    """
    Edit a Product by its ID.
    Expected JSON:
    {
        "product_id": "<product_id>",
        "name": "Updated name",
        "price": 199.99
    }
    """
    data = request.data
    product_id = data.get("product_id")
    name = data.get("name")
    price = data.get("price")

    # Validate presence of all required fields
    if not all([product_id, name]) or price is None:
        return Response({"error": "Missing product_id, name, or price"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(product_id):
        return Response({"error": "Invalid product_id"}, status=status.HTTP_400_BAD_REQUEST)

    # Fetch and update product
    product = Product.objects(id=ObjectId(product_id)).first()
    if not product:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    product.name = name
    product.price = price
    product.save()

    return Response({"message": "Product updated successfully"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def get_products_data(request):
    project_id = request.data.get("project_id")
    if not project_id:
        return Response({"error": "Missing project_id"}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_object_id(project_id):
        return Response({"error": "Invalid project_id"}, status=status.HTTP_400_BAD_REQUEST)

    project = Project.objects(id=ObjectId(project_id)).first()
    if not project:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    products = Product.objects(project=project).order_by('-created_at')

    product_list = []
    total_cost = 0.0

    for product in products:
        product_list.append({
            "id": str(product.id),
            "name": product.name,
            "price": product.price
        })

    return Response({
        "project_id": project_id,
        "products": product_list
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def get_project_notes_with_summary(request):
    """
    Fetch all notes for a project and generate a summary using Ollama
    Accepts POST request with project_id in request body
    """
    try:
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_id = ObjectId(project_id)
        except:
            return Response({"error": "Invalid project ID format"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects(id=object_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        notes = Note.objects(project=project).order_by('-created_at')
        note_list = [
            {
                "title": note.title,
                "content": note.content,
            }
            for note in notes
        ]

        # Prepare a prompt for LLM using note content
        combined_content = "\n\n".join([f"{note['title']}:\n{note['content']}" for note in note_list])
        prompt = (
    "You are an R&D researcher. Carefully analyze the following multiple project notes and generate a single, large, detailed, and highly relevant consolidated project note.\n\n"
    "Your task is NOT to simply summarize. Instead, extract and merge the most important technical information, insights, decisions, data points, findings, and action items from across all notes.\n\n"
    "Ensure the consolidated note is comprehensive, technically rich, and suitable for reference by the R&D and management teams.\n\n"
    f"{combined_content}"
)

        llm = SummarizerConfig.get_llm()
        if not llm:
            return Response({"error": "Ollama LLM is not initialized"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content


        return Response({
            "summary": content,
        })

    except Exception as e:
        logger.error(f"Error in get_project_notes_with_summary: {str(e)}", exc_info=True)
        return Response({"error": "Internal server error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)