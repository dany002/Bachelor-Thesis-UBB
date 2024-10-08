from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from cyblo.cyblo_app.Views.BiLSTMViewSQLi import check_file_sql_bilstm, get_records_with_bilstm_sql
from cyblo.cyblo_app.Views.BiLSTMViewXSS import check_file_xss_bilstm, get_records_with_bilstm_xss
from cyblo.cyblo_app.Views.ConnectionsView import create_external_db_connection, get_connections_for_a_project, \
    get_connections_for_a_specific_user, edit_connection, delete_connection, get_tables_for_a_connection
from cyblo.cyblo_app.Views.FileView import check_file_sql, get_logs, get_files_for_a_specific_user, edit_file, \
    delete_file
from cyblo.cyblo_app.Views.ProjectView import get_user_projects, add_project, add_file, \
    get_files_for_a_specific_project, edit_project, delete_project
from cyblo.cyblo_app.Views.RFViewSQLi import get_records_with_random_forests_sql, check_file_sql_random
from cyblo.cyblo_app.Views.RFViewXSS import get_records_with_random_forests_xss, check_file_xss_random
from cyblo.cyblo_app.Views.RegexViewSQLi import get_records_with_regex_sql, check_file_sql_regex
from cyblo.cyblo_app.Views.RegexViewXSS import get_records_with_regex_xss, check_file_xss_regex
from cyblo.cyblo_app.Views.UserView import RegisterUser, LogoutUser, LoginUser, get_token_expiration
from cyblo.cyblo_app.Views.UtilsView import run_manual_selection

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
    path('connections/projects/<uuid:project_id>', get_connections_for_a_project, name='get_connections_for_a_project'),
    path('connections', get_connections_for_a_specific_user, name='get_connections_for_a_specific_user'),
    path('connections/add', create_external_db_connection, name='add_connection'),
    path('connections/edit', edit_connection, name='edit_connection'),
    path('connections/delete/<uuid:connection_id>', delete_connection, name='delete_connection'),
    path('connections/<uuid:connection_id>/tables', get_tables_for_a_connection, name='get_tables_for_a_connection'),
    path('get_records_with_bilstm_sql', get_records_with_bilstm_sql, name='get_records_with_bilstm_sql'),
    path('get_records_with_random_forests_sql', get_records_with_random_forests_sql, name='get_records_with_random_forests_sql'),
    path('get_records_with_regex_sql', get_records_with_regex_sql, name='get_records_with_regex_sql'),
    path('get_records_with_bilstm_xss', get_records_with_bilstm_xss, name='get_records_with_bilstm_xss'),
    path('get_records_with_random_forests_xss', get_records_with_random_forests_xss, name='get_records_with_random_forests_xss'),
    path('get_records_with_regex_xss', get_records_with_regex_xss, name='get_records_with_regex_xss'),
    path('check_file_sql_regex/<uuid:file_id>', check_file_sql_regex, name='check_file_sql_regex'),
    path('check_file_sql_bilstm/<uuid:file_id>', check_file_sql_bilstm, name='check_file_sql_ai'),
    path('check_file_sql_random_forests/<uuid:file_id>', check_file_sql_random, name='check_file_sql_random'),
    path('check_file_xss_regex/<uuid:file_id>', check_file_xss_regex, name='check_file_xss_regex'),
    path('check_file_xss_bilstm/<uuid:file_id>', check_file_xss_bilstm, name='check_file_xss_ai'),
    path('check_file_xss_random_forests/<uuid:file_id>', check_file_xss_random, name='check_file_xss_random'),
    path('run_manual_selection', run_manual_selection, name='run-run_manual_selection'),
]
