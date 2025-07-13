from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from register.models import User
from mongoengine.errors import DoesNotExist
from django.contrib.auth.hashers import check_password

@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    if not request.body:
        return JsonResponse({'error': 'Empty request body'}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)

    email = data.get('email')
    password = data.get('password')

    # Validate fields
    if not email or not password:
        return JsonResponse({'error': 'Email and password are required'}, status=400)

    try:
        # Try to find user by email
        user = User.objects.get(email=email)

        # Check hashed password
        if check_password(password, user.password):
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'name': user.name,
                    "id": str(user.id),
                    'profile_image': user.profile_image
                }
            }, status=200)
        else:
            return JsonResponse({'error': 'Invalid password'}, status=401)

    except DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    except Exception as e:
        print("Unexpected error in login_user:", e)
        return JsonResponse({'error': 'Internal server error'}, status=500)
