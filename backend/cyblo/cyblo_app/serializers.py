from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers

from .models import Project, File, Log
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
        fields = ['id', 'name', 'user']

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'project', 'path']

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = ['id', 'timestamp', 'query', 'file']
