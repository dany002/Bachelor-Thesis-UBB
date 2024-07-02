from datetime import datetime, timedelta

import jwt
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from cyblo.cyblo_app.serializers import UserSerializer


class RegisterUser(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginUser(APIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    def post(self, request):

        response = Response()
        response.delete_cookie('jwt')

        password = request.data.get('password', None)
        username_or_email = request.data.get('username', None)
        if not username_or_email or not password:
            return Response({'error': 'Username or email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(email=username_or_email)
            username = user.username
        except User.DoesNotExist:
            username = username_or_email

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)

        access_token = refresh.access_token
        expiration_time = datetime.now() + timedelta(seconds=access_token.lifetime.total_seconds())

        response = Response(data={'success': 'Login successful'}, status=status.HTTP_200_OK)
        response.set_cookie('jwt', str(access_token), httponly=True)
        return response

class LogoutUser(APIView):
    def post(self, request):
        response = JsonResponse({'success': 'Logout successful'})
        response.delete_cookie('jwt')
        return response



def check_token(request):
    token = request.COOKIES.get('jwt')
    if not token:
        return Response({'error': 'Token not found'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Use JWTAuthentication to validate the token
        authenticated_user, jwt_value = JWTAuthentication().authenticate(request)
        print(authenticated_user)
        print(jwt_value)
        if not authenticated_user or not jwt_value:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        expiration_timestamp = jwt_value.get('exp', None)
        current_timestamp = datetime.now().timestamp()

        if not expiration_timestamp or current_timestamp > expiration_timestamp:
            return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'message': 'Token is valid'}, status=status.HTTP_200_OK)

    except (InvalidToken, TokenError):
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
def get_token_expiration(request):
    token = request.COOKIES.get('jwt')
    if not token:
        return JsonResponse({'error': 'Token not found'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        expiration_timestamp = decoded_token.get('exp', None)
        if not expiration_timestamp:
            return JsonResponse({'error': 'Expiration time not found in token'}, status=status.HTTP_400_BAD_REQUEST)

        expiration_date = datetime.fromtimestamp(expiration_timestamp)
        return JsonResponse({'expiration_date': expiration_date}, status=status.HTTP_200_OK)

    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
