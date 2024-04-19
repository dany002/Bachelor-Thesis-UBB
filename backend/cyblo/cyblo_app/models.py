from enum import Enum
import uuid

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
# A user can have multiple projects. A project has multiple Files. Each file contains multiple logs. Each log can have multiple types


class User(AbstractUser):
    pass

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    path = models.TextField(max_length=300)

class LogType(Enum):
    SQL = 'SQL'
    XSS = 'XSS'
    DDOS = 'DDOS'
    ANOMALY = 'Anomaly'
    NONE = 'None'

class Log(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField()
    query = models.TextField()
    file = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, related_name='logs')
    type = models.CharField(choices=[(tag, tag.value) for tag in LogType], max_length=20)
    level = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])

