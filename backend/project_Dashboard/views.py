from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from bson import ObjectId
from register.models import User
from .models import Project
import datetime

@csrf_exempt
def get_project_details(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')

            # Validate input
            if not user_id:
                return JsonResponse({"status": "error", "message": "user_id is required."}, status=400)
            if not ObjectId.is_valid(user_id):
                return JsonResponse({"status": "error", "message": "Invalid user_id."}, status=400)

            # Fetch user
            user = User.objects(id=ObjectId(user_id)).first()
            if not user:
                return JsonResponse({"status": "error", "message": "User not found."}, status=404)

            # Fetch all projects of the user
            projects = Project.objects(user=user)

            # Serialize the projects
            project_list = []
            for project in projects:
                project_list.append({
                    "id": str(project.id),
                    "title": project.title,
                    "description": project.description,
                    "category": project.category,
                    "created_at": project.created_at.strftime
                    ('%Y-%m-%d') if project.created_at else None
                })

            return JsonResponse({"status": "success", "projects": project_list}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Invalid JSON."}, status=400)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "error", "message": "Only POST method allowed."}, status=405)

@csrf_exempt
def new_project_details(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Extract fields from JSON request
            title = data.get('title')
            description = data.get('description')
            user_id = data.get('user_id')
            category = data.get('category')# Must be MongoDB _id string

            # Validate input
            if not (title and user_id):
                return JsonResponse({"status": "error", "message": "Title and user_id are required."}, status=400)

            # Convert user_id to ObjectId
            if not ObjectId.is_valid(user_id):
                return JsonResponse({"status": "error", "message": "Invalid user_id."}, status=400)

            user = User.objects(id=ObjectId(user_id)).first()
            if not user:
                return JsonResponse({"status": "error", "message": "User not found."}, status=404)

            # Create and save the project
            project = Project(
                title=title,
                description=description,
                created_at=datetime.datetime.utcnow(),
                user=user,
                category=category
            )
            project.save()

            return JsonResponse({
                "status": "success",
                "message": "Project created successfully!",
                "project_id": str(project.id)
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Invalid JSON."}, status=400)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "error", "message": "Only POST method allowed."}, status=405)
