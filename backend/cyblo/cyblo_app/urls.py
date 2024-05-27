from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from cyblo.cyblo_app.Views.FileView import check_file_sql, get_logs, get_files_for_a_specific_user, edit_file, \
    delete_file
from cyblo.cyblo_app.Views.ProjectView import get_user_projects, add_project, add_file, \
    get_files_for_a_specific_project, edit_project, delete_project
from cyblo.cyblo_app.Views.UserView import RegisterUser, LogoutUser, LoginUser, get_token_expiration
from cyblo.cyblo_app.Views.UtilsView import create_external_db_connection, get_connections_for_a_project, \
    get_connections_for_a_specific_user, edit_connection, delete_connection

urlpatterns = [
    path('register', RegisterUser.as_view(), name='register-user'),
    path('login', LoginUser.as_view(), name='login'),
    path('logout', LogoutUser.as_view(), name='logout'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/check', get_token_expiration, name='token_check'),
    path('projects', get_user_projects, name='get_user_projects'),
    path('projects/add', add_project, name='add_project'),
    path('projects/<uuid:project_id>', get_files_for_a_specific_project, name='get_files_for_a_specific_project'),
    path('projects/edit', edit_project, name='edit_project'),
    path('projects/delete/<uuid:project_id>', delete_project, name='delete_project'),
    path('files', get_files_for_a_specific_user, name='get_files_for_a_specific_user'),
    path('files/add', add_file, name='add_file'),
    path('files/edit', edit_file, name='edit_file'),
    path('files/delete/<uuid:file_id>',delete_file, name='delete_file'),
    path('files/checksql/<uuid:file_id>', check_file_sql, name='check_file_sql'),
    path('files/<uuid:file_id>', get_logs, name='get_logs'),
    path('connections/add', create_external_db_connection, name='add_connection'),
    path('connections/projects/<uuid:project_id>', get_connections_for_a_project, name='get_connections_for_a_project'),
    path('connections', get_connections_for_a_specific_user, name='get_connections_for_a_specific_user'),
    path('connections/edit', edit_connection, name='edit_connection'),
    path('connections/delete/<uuid:connection_id>', delete_connection, name='delete_connection'),
]
