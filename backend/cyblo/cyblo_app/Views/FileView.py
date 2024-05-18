import os
import re
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from cyblo.cyblo_app.models import File
from cyblo.cyblo_app.serializers import FileSerializer, LogSerializer


class FileList(generics.ListCreateAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer


class FileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer

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



def detect_sql_injection(sql_query):
    # Comments regex
    comments_regex = re.compile(r'(--|\/\*|\*\/|["]{2,}\s*|\S;\s*\S|^\"[^"]*\"$|#|^1["\']|^1\s+[\"\'])')
    if comments_regex.search(sql_query):
        return True

    # Tautology regex
    tautology_regex = re.compile(r"\b(\w+)\s*=\s*\1\b|([\"']\w+[\"']\s+[\"']\w+[\"'])|(\w+)\s+LIKE\s+\3\b", re.IGNORECASE)
    if tautology_regex.search(sql_query):
        return True

    # Keyword regex
    keyword_regex = re.compile(
        r'\b(sleep|version|postgres|postgresql|schema|table|database|information_schema|pg_catalog|sysusers|systables|utl_inaddr|dbms_pipe|pg_sleep|rdb\$[\w_]*|waitfor|delay)\b',
        re.IGNORECASE)
    if keyword_regex.search(sql_query):
        return True

    return False
