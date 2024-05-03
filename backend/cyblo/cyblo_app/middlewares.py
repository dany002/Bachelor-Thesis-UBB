from django.utils.deprecation import MiddlewareMixin

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Extract JWT token from the cookie
        jwt_token = request.COOKIES.get('jwt')

        if jwt_token:
            # Attach the token to the request for authentication middleware or view functions
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {jwt_token}'