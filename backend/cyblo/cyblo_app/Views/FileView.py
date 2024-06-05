import os
import re

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND

from cyblo.cyblo_app.Views.UtilsView import detect_sql_injection
from cyblo.cyblo_app.models import File, Log, Project
from cyblo.cyblo_app.serializers import FileSerializer, LogSerializer


class FileList(generics.ListCreateAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer


class FileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_files_for_a_specific_user(request):
    user = request.user
    files = File.objects.filter(project__user=user)
    if files.exists():
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data, status=HTTP_200_OK)
    else:
        return Response({"detail": "No files found for the user."}, status=HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_file(request):
    try:
        id = request.data['id']
        file = File.objects.get(id=id)
    except File.DoesNotExist:
        return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

    file_serializer = FileSerializer(file, data=request.data, partial=True)

    try:
        file_serializer.is_valid(raise_exception=True)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    file = file_serializer.save()

    return Response(file_serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_file(request, file_id):
    try:
        # Retrieve the project instance to be deleted
        file = get_object_or_404(File, id=file_id)
        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_file_sql(request, file_id):

    try:
        file_instance = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response({'detail': 'File not found'}, status=status.HTTP_404_NOT_FOUND)


    file_path = os.path.join(os.getenv('SECURE_PATH_FOR_FILES'), str(file_id))
    last_read_position = file_instance.last_read_position
    file_size = os.path.getsize(file_path)

    if not os.path.exists(file_path):
        return Response({'detail': 'File does not exist on the server'}, status=status.HTTP_404_NOT_FOUND)

    with open(file_path, 'r') as file:
        file.seek(last_read_position)
        for line in file:
            sql_query = line.strip()
            ok = detect_sql_injection(sql_query)
            level = 10 if ok else 0

            log_data = {
                'timestamp': timezone.now(),
                'query': sql_query,
                'file': file_instance.id,
                'level': level
            }
            log_serializer = LogSerializer(data=log_data)
            if log_serializer.is_valid():
                log_serializer.save()

        # Update file's last read position and last checked size
        file_instance.last_read_position = file.tell()
        file_instance.last_checked_size = file_size
        file_instance.last_checked_time = timezone.now()
        file_instance.save()

    return Response({'detail': 'File processed successfully'}, status=status.HTTP_200_OK)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_logs(request, file_id):
    try:
        logs = Log.objects.filter(file_id=file_id)
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Log.DoesNotExist:
        return Response({'detail': 'Logs not found'}, status=status.HTTP_404_NOT_FOUND)

