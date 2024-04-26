from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from cyblo.cyblo_app.Views.UserView import RegisterUser, LogoutUser, LoginUser, get_token_expiration

urlpatterns = [
    path('register', RegisterUser.as_view(), name='register-user'),
    path('login', LoginUser.as_view(), name='login'),
    path('logout', LogoutUser.as_view(), name='logout'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/check', get_token_expiration, name='token_check'),
]
