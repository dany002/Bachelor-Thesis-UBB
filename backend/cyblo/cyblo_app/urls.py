from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from cyblo.cyblo_app.Views.FileView import check_file_sql, get_logs
from cyblo.cyblo_app.Views.ProjectView import get_user_projects, add_project, add_file, get_files_for_a_specific_project
from cyblo.cyblo_app.Views.UserView import RegisterUser, LogoutUser, LoginUser, get_token_expiration

urlpatterns = [
    path('register', RegisterUser.as_view(), name='register-user'),
    path('login', LoginUser.as_view(), name='login'),
    path('logout', LogoutUser.as_view(), name='logout'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/check', get_token_expiration, name='token_check'),
    path('projects', get_user_projects, name='get_user_projects'),
    path('projects/add', add_project, name='add_project'),
    path('projects/<uuid:project_id>', get_files_for_a_specific_project, name='get_files_for_a_specific_project'),
    path('files/add', add_file, name='add_file'),
    path('files/checksql/<uuid:file_id>', check_file_sql, name='check_file_sql'),
    path('files/<uuid:file_id>', get_logs, name='get_logs'),
]
