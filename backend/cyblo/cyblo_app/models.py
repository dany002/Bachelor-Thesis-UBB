from enum import Enum
import uuid
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from django.conf import settings
from rest_framework.exceptions import ValidationError


# A user can have multiple projects. A project has multiple Files. Each file contains multiple logs. Each log can have multiple types

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


class ExternalDBConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.IntegerField()
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    database = models.CharField(max_length=100)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='external_db_connections', default=None)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='external_db_connections', default=None)

class Log(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField()
    query = models.TextField()
    log_type = models.CharField(choices=[(tag, tag.value) for tag in LogType], max_length=20, default=LogType.NONE.value)
    file = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    external_connection = models.ForeignKey(ExternalDBConnection, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    level = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])

    def clean(self):
        if self.file_id is None and self.external_connection_id is None:
            raise ValidationError('Either file or external connection must be specified.')
        elif self.file_id is not None and self.external_connection_id is not None:
            raise ValidationError('Log cannot be associated with both a file and an external connection.')

