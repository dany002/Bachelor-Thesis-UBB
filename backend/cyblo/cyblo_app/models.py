from enum import Enum
import uuid
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from django.conf import settings

# A user can have multiple projects. A project has multiple Files. Each file contains multiple logs. Each log can have multiple types



# class User(AbstractUser):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     class Meta:
#         db_table = 'cyblo_user'
#
#     # Define intermediary models for the ManyToManyField relationships
#     class UserGroup(models.Model):
#         user = models.ForeignKey('User', on_delete=models.CASCADE)
#         group = models.ForeignKey(Group, on_delete=models.CASCADE)
#
#     class UserPermission(models.Model):
#         user = models.ForeignKey('User', on_delete=models.CASCADE)
#         permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
#
#     # Specify unique related_name for groups and user_permissions
#     groups = models.ManyToManyField(
#         Group,
#         through=UserGroup,
#         through_fields=('user', 'group'),
#         related_name='cyblo_users'
#     )
#     user_permissions = models.ManyToManyField(
#         Permission,
#         through=UserPermission,
#         through_fields=('user', 'permission'),
#         related_name='cyblo_users'
#     )

class LogType(Enum):
    SQL = 'SQL'
    XSS = 'XSS'
    DDOS = 'DDOS'
    ANOMALY = 'Anomaly'
    NONE = 'None'
class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(default=None)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    path = models.TextField(max_length=300)
    last_checked_size = models.BigIntegerField(default=0)
    last_checked_time = models.DateTimeField(null=True, blank=True)
    last_read_position = models.BigIntegerField(default=0)
    service_account_key = models.TextField(null=True, blank=True)
    type = models.CharField(choices=[(tag, tag.value) for tag in LogType], max_length=20, default=LogType.NONE.value)


class Log(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField()
    query = models.TextField()
    file = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, related_name='logs')
    level = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
