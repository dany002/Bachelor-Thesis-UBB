import json
import os

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import JsonResponse
from google.cloud import storage
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from cyblo.cyblo_app.models import Project, LogType, File
from cyblo.cyblo_app.permissions import IsOwner
from cyblo.cyblo_app.serializers import ProjectSerializer, FileSerializer
from django.contrib.auth.models import User

class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


@api_view(['GET'])
@permission_classes([IsOwner, IsAuthenticated])
def get_user_projects(request):
    user = request.user
    projects = Project.objects.filter(user=user)
    if not projects.exists():
        return JsonResponse({'message': 'No projects found for the user'}, status=status.HTTP_200_OK)
    project_data = [{'id': project.id, 'name': project.name, 'description': project.description} for project in projects]
    return JsonResponse({'projects': project_data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_project(request):
    project_data = {
        'name': request.data.get('name'),
        'description': request.data.get('description'),
        'user': request.user.id,
    }
    project_serializer = ProjectSerializer(data=project_data)

    try:
        project_serializer.is_valid(raise_exception=True)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    project = project_serializer.save(user=request.user)
    serialized_project = ProjectSerializer(project).data  # Serialize the project

    return Response(serialized_project, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_project(request):
    project_id = request.data.get('id')
    try:
        # Retrieve the existing project instance
        project = Project.objects.get(id=project_id, user=request.user.id)
    except Project.DoesNotExist:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    # Update the project fields with the new data

    project_data = request.data
    project_data['user'] = request.user.id
    # Validate and save the updated project instance
    print(project_data)
    project_serializer = ProjectSerializer(instance=project, data=project_data)
    try:
        project_serializer.is_valid(raise_exception=True)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    project_serializer.save()

    # Serialize the updated project and return the response
    serialized_project = ProjectSerializer(project).data
    return Response(serialized_project, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_file(request):
    file_data = request.data.copy()
    file_serializer = FileSerializer(data=file_data)

    try:
        file_serializer.is_valid(raise_exception=True)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    file_type = file_data.get('type', LogType.NONE.value)
    try:
        log_type = file_type
    except KeyError:
        return Response({'detail': f'Invalid log type: {file_type}'}, status=status.HTTP_400_BAD_REQUEST)

    file_data['type'] = log_type

    file = file_serializer.save()

    download_response = download_file_from_gcs(file.path, file.service_account_key, str(file.id))

    if not download_response['success']:
        file.delete()
        return Response({'detail': 'Failed to download file from GCS: ' + download_response['error']},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    file.last_checked_size = download_response['last_checked_size']
    file.last_checked_time = download_response['last_checked_time']
    file.save()

    return Response(file_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_project(request, project_id):
    try:
        # Retrieve the project instance to be deleted
        project = get_object_or_404(Project, id=project_id, user=request.user)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_files_for_a_specific_project(request, project_id):
    try:
        print("HI")
        project = get_object_or_404(Project, id=project_id, user=request.user)
        files = File.objects.filter(project=project)

        # Serialize the files and return the response
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Project.DoesNotExist:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

def download_file_from_gcs(file_path, service_account_key, file_id):
    try:
        service_account_info = json.loads(service_account_key)

        client = storage.Client.from_service_account_info(service_account_info)
        bucket_name, blob_name = parse_gcs_path(file_path)

        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        path_env = os.getenv('SECURE_PATH_FOR_FILES')

        local_path = f'{path_env}{file_id}'
        blob.download_to_filename(local_path)

        # Get the file size
        last_checked_size = os.path.getsize(local_path)

        # Set the last checked time
        last_checked_time = timezone.now()

        return {
            'success': True,
            'file_path': local_path,
            'last_checked_size': last_checked_size,
            'last_checked_time': last_checked_time
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def parse_gcs_path(gcs_path):
    if gcs_path.startswith('gs://'):
        parts = gcs_path[5:].split('/', 1)
        if len(parts) == 2:
            return parts[0], parts[1]
    raise ValueError('Invalid GCS path format')