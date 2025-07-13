# register/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User  # MongoEngine User model
from mongoengine.errors import NotUniqueError, ValidationError
from django.contrib.auth.hashers import make_password

@csrf_exempt
def register_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    if not request.body:
        return JsonResponse({'error': 'Empty request body'}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    emp_id = data.get('emp_id')
    profile_image = data.get('profile_image', None)  # optional

    # Validate required fields
    missing_fields = [field for field in ['name', 'email', 'password', 'emp_id'] if not data.get(field)]
    if missing_fields:
        return JsonResponse({'error': f'Missing fields: {", ".join(missing_fields)}'}, status=400)

    try:
        # 🔐 Hash the password before saving
        hashed_password = make_password(password)

        # Save user to MongoDB
        user = User(
            name=name,
            email=email,
            password=hashed_password,
            emp_id=emp_id,
            profile_image=profile_image
        )
        user.save()

        return JsonResponse({'message': 'User registered successfully'}, status=201)

    except NotUniqueError:
        return JsonResponse({'error': 'Email or employee ID already exists'}, status=400)

    except ValidationError as ve:
        return JsonResponse({'error': f'Validation error: {ve}'}, status=400)

    except Exception as e:
        print("Unexpected error in register_user:", e)
        return JsonResponse({'error': 'Internal server error'}, status=500)
