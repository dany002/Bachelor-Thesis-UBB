from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers

from .models import Project, File, Log, LogType, ExternalDBConnection
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True},
                        'email': {'validators': [EmailValidator(message="Enter a valid email address.")]}
                        }

    def create(self, validated_data):
        user = get_user_model().objects.create_user(**validated_data)
        return user

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'user']


class FileSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(choices=[(tag.value, tag.name) for tag in LogType])  # Change here
    project_id = serializers.UUIDField(write_only=True)
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = File
        fields = ['id', 'project_id', 'project', 'path', 'last_checked_size', 'last_checked_time', 'last_read_position', 'service_account_key', 'type']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['type'] = LogType(instance.type).name  # Convert the value back to the enum name
        return ret

    def create(self, validated_data):
        project_id = validated_data.pop('project_id')
        project = Project.objects.get(id=project_id)
        file = File.objects.create(project=project, **validated_data)
        return file

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = ['id', 'timestamp', 'query', 'file', 'level']


class ExternalDBConnectionSerializer(serializers.ModelSerializer):
    port = serializers.IntegerField()
    class Meta:
        model = ExternalDBConnection
        fields = ['id', 'name', 'host', 'port', 'username', 'password', 'database', 'project', 'user']