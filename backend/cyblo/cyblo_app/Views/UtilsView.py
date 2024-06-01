import json
import pickle
import re
from datetime import datetime, timedelta

import psycopg2
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from psycopg2 import sql
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_404_NOT_FOUND

from cyblo.cyblo_app.models import Project, ExternalDBConnection
from cyblo.cyblo_app.serializers import ExternalDBConnectionSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_external_db_connection(request):
    # Extract data from request payload
    user = request.user
    print(user)
    data = request.data
    project_id = data.get('project_id')  # Corrected this line

    # Validate project_id and user_id
    if project_id is None:
        return Response({'detail': 'Project ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        project = Project.objects.get(id=project_id, user=user)
    except Project.DoesNotExist:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    data['user'] = user.id
    # Create serializer instance with data
    serializer = ExternalDBConnectionSerializer(data=data)
    if serializer.is_valid():
        # Assign project to the serializer instance
        serializer.validated_data['project'] = project

        # Save the ExternalDBConnection instance
        external_db_connection = serializer.save()

        # Optionally, perform additional actions after saving

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        errors = serializer.errors
        print(errors)  # Print or log the validation errors
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_connections_for_a_project(request, project_id):
    # Extract user from request
    user = request.user

    try:
        # Retrieve the project object
        project = Project.objects.get(id=project_id, user=user)
    except Project.DoesNotExist:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    # Retrieve all external database connections related to the project
    connections = ExternalDBConnection.objects.filter(project=project)

    # Serialize the connections
    serializer = ExternalDBConnectionSerializer(connections, many=True)

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_connections_for_a_specific_user(request):
    user = request.user
    connections = ExternalDBConnection.objects.filter(user=user)
    if connections.exists():
        serializer = ExternalDBConnectionSerializer(connections, many=True)
        return Response(serializer.data, status=HTTP_200_OK)
    else:
        return Response({"detail": "No connections found for the user."}, status=HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_connection(request):
    try:
        id = request.data.get('id')
        if not id:
            return Response({'detail': 'ID not provided'}, status=status.HTTP_400_BAD_REQUEST)
        connection = ExternalDBConnection.objects.get(id=id)
    except ExternalDBConnection.DoesNotExist:
        return Response({'detail': 'Connection not found'}, status=status.HTTP_404_NOT_FOUND)

    # Debug: Print the request data
    print("Request data:", request.data)

    connection_serializer = ExternalDBConnectionSerializer(connection, data=request.data, partial=True)

    try:
        connection_serializer.is_valid(raise_exception=True)
    except Exception as e:
        # Debug: Print the serializer errors
        print("Serializer errors:", connection_serializer.errors)
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Ensure to call save on the serializer
    connection = connection_serializer.save()

    # Debug: Print the updated object
    print("Updated connection:", connection)

    return Response(connection_serializer.data, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_connection(request, connection_id):
    try:
        # Retrieve the project instance to be deleted
        connection = get_object_or_404(ExternalDBConnection, id=connection_id)
        connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tables_for_a_connection(request, connection_id):
    try:
        # Retrieve the connection information from the database
        connection = ExternalDBConnection.objects.get(id=connection_id)
        connection_data = ExternalDBConnectionSerializer(connection).data
        # Extract connection details
        dbname = connection_data['database']
        user = connection_data['username']
        password = connection_data['password']
        host = connection_data['host']
        port = connection_data['port']

        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )

        # Create a cursor object
        cursor = conn.cursor()

        # Execute the SQL query to fetch all table names
        cursor.execute(
            sql.SQL(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
            )
        )

        # Fetch all table names
        tables = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        conn.close()

        # Extract table names from the query result
        table_names = [table[0] for table in tables]

        # Return the list of table names in the response
        return Response({'tables': table_names}, status=status.HTTP_200_OK)

    except ExternalDBConnection.DoesNotExist:
        return Response({'detail': 'Connection not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


with open('models/tokenizer_sql.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)
model = load_model('models/best_model.h5')
max_len = 544  # Replace this with the max_len value used during training


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_records_with_ai_sql(request):
    data = json.loads(request.body)
    table = data.get('table')
    connection_id = data.get('connection_id')
    current_timestamp = data.get('current_timestamp')
    offset = data.get('offset', 0)

    if not connection_id:
        return JsonResponse({'error': 'Connection ID is required'}, status=400)

    if not current_timestamp:
        return JsonResponse({'error': 'Current timestamp is required'}, status=400)

    try:
        connection_details = ExternalDBConnection.objects.get(id=connection_id)
    except ExternalDBConnection.DoesNotExist:
        return JsonResponse({'error': 'Invalid connection ID'}, status=400)

    try:
        # Establish a connection to the external database
        conn = psycopg2.connect(
            host=connection_details.host,
            port=connection_details.port,
            user=connection_details.username,
            password=connection_details.password,
            database=connection_details.database
        )
        cursor = conn.cursor()

        # Assuming current_timestamp is in the format 'HH:MM'
        current_datetime = datetime.strptime(current_timestamp, '%H:%M')

        # Calculate the start and end timestamps based on the offset
        start_time = current_datetime + timedelta(seconds=offset * 100)
        end_time = start_time + timedelta(seconds=100)

        # Convert to strings for SQL query
        start_time_str = start_time.strftime('%H:%M:%S')
        end_time_str = end_time.strftime('%H:%M:%S')

        cursor.execute(f"""
            SELECT query, timestamp 
            FROM {table} 
            WHERE timestamp::time >= %s AND timestamp::time < %s
            ORDER BY timestamp
            """, [start_time_str, end_time_str])

        records = cursor.fetchall()
        cursor.close()
        conn.close()
        records = [{'query': record[0], 'timestamp': record[1]} for record in records]

        # Preprocess and predict
        queries = [record['query'] for record in records]
        X_seq = tokenizer.texts_to_sequences(queries)
        X_pad = pad_sequences(X_seq, maxlen=max_len, padding='post')
        predictions = model.predict(X_pad)
        binary_predictions = (predictions > 0.5).astype(int).squeeze()

        # Add predictions to records
        for i, record in enumerate(records):
            record['prediction'] = int(binary_predictions[i])

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_records_with_regex_sql(request):
    data = json.loads(request.body)
    table = data.get('table')
    connection_id = data.get('connection_id')
    current_timestamp = data.get('current_timestamp')
    offset = data.get('offset', 0)

    if not connection_id:
        return JsonResponse({'error': 'Connection ID is required'}, status=400)

    if not current_timestamp:
        return JsonResponse({'error': 'Current timestamp is required'}, status=400)

    try:
        connection_details = ExternalDBConnection.objects.get(id=connection_id)
    except ExternalDBConnection.DoesNotExist:
        return JsonResponse({'error': 'Invalid connection ID'}, status=400)

    try:
        # Establish a connection to the external database
        conn = psycopg2.connect(
            host=connection_details.host,
            port=connection_details.port,
            user=connection_details.username,
            password=connection_details.password,
            database=connection_details.database
        )
        cursor = conn.cursor()

        # Assuming current_timestamp is in the format 'HH:MM'
        current_datetime = datetime.strptime(current_timestamp, '%H:%M')

        # Calculate the start and end timestamps based on the offset
        start_time = current_datetime + timedelta(seconds=offset * 100)
        end_time = start_time + timedelta(seconds=100)

        # Convert to strings for SQL query
        start_time_str = start_time.strftime('%H:%M:%S')
        end_time_str = end_time.strftime('%H:%M:%S')

        cursor.execute(f"""
            SELECT query, timestamp 
            FROM {table} 
            WHERE timestamp::time >= %s AND timestamp::time < %s
            ORDER BY timestamp
            """, [start_time_str, end_time_str])

        records = cursor.fetchall()
        cursor.close()
        conn.close()
        records = [{'query': record[0], 'timestamp': record[1]} for record in records]

        for record in records:
            record['prediction'] = int(detect_sql_injection(record['query']))

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


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