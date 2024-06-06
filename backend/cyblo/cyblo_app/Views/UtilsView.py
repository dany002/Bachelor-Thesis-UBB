import json
import os
import pickle
import random
import re
import time
import urllib.parse
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

from cyblo.cyblo_app.models import Project, ExternalDBConnection, File
from cyblo.cyblo_app.serializers import ExternalDBConnectionSerializer
from sklearn.metrics import confusion_matrix, accuracy_score, f1_score, recall_score, precision_score

with open('models/tokenizer_sql.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)
model = load_model('models/best_model.h5')
max_len = 544  # Replace this with the max_len value used during training

with open('models/tokenizer_xss.pickle', 'rb') as handle:
    tokenizer_xss = pickle.load(handle)
model_xss = load_model('models/best_model_xss_hard_dataset.h5')
max_len_xss = 606

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_file_sql_regex(request, file_id):
    data = json.loads(request.body)
    page_number = data.get('page', 1)
    timestamp = data.get('timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    if not file_id:
        return JsonResponse({'error': 'File ID is required'}, status=400)

    try:
        file = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return JsonResponse({'error': 'Invalid file ID'}, status=400)

    try:
        file_path = os.path.join(os.getenv('SECURE_PATH_FOR_FILES'), str(file_id))
        page_size = random.randint(100, 200)
        offset = (page_number - 1) * page_size

        records = []
        with open(file_path, 'r') as file:
            # Skip lines until offset
            for _ in range(offset):
                file.readline()

            # Read lines for the current page
            for _ in range(page_size):
                line = file.readline().strip()  # Strip to remove leading/trailing whitespace
                if not line:
                    break
                is_sql_injection = int(detect_sql_injection(line))
                records.append({'query': line,  'timestamp': timestamp, 'prediction': is_sql_injection})
        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_file_sql_ai(request, file_id):
    data = json.loads(request.body)
    page_number = data.get('page', 1)
    timestamp = data.get('timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    if not file_id:
        return JsonResponse({'error': 'File ID is required'}, status=400)

    try:
        file = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return JsonResponse({'error': 'Invalid file ID'}, status=400)

    try:
        file_path = os.path.join(os.getenv('SECURE_PATH_FOR_FILES'), str(file_id))
        page_size = random.randint(100, 200)
        offset = (page_number - 1) * page_size

        records = []
        with open(file_path, 'r') as file:
            # Skip lines until offset
            for _ in range(offset):
                file.readline()

            # Read lines for the current page
            for _ in range(page_size):
                line = file.readline().strip()  # Strip to remove leading/trailing whitespace
                if not line:
                    break
                records.append({'query': line,  'timestamp': timestamp})

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_records_with_ai_xss(request):
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
        X_seq = tokenizer_xss.texts_to_sequences(queries)
        X_pad = pad_sequences(X_seq, maxlen=max_len_xss, padding='post')
        predictions = model_xss.predict(X_pad)
        binary_predictions = (predictions > 0.5).astype(int).squeeze()

        # Add predictions to records
        for i, record in enumerate(records):
            record['prediction'] = int(binary_predictions[i])

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_records_with_regex_xss(request):
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
            record['prediction'] = int(detect_xss_injection(record['query']))

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_file_xss_regex(request, file_id):
    data = json.loads(request.body)
    page_number = data.get('page', 1)
    timestamp = data.get('timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    if not file_id:
        return JsonResponse({'error': 'File ID is required'}, status=400)

    try:
        file = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return JsonResponse({'error': 'Invalid file ID'}, status=400)

    try:
        file_path = os.path.join(os.getenv('SECURE_PATH_FOR_FILES'), str(file_id))
        page_size = random.randint(100, 200)
        offset = (page_number - 1) * page_size

        records = []
        with open(file_path, 'r') as file:
            # Skip lines until offset
            for _ in range(offset):
                file.readline()

            # Read lines for the current page
            for _ in range(page_size):
                line = file.readline().strip()  # Strip to remove leading/trailing whitespace
                if not line:
                    break
                is_xss = int(detect_xss_injection(line))
                records.append({'query': line,  'timestamp': timestamp, 'prediction': is_xss})
        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_file_xss_ai(request, file_id):
    data = json.loads(request.body)
    page_number = data.get('page', 1)
    timestamp = data.get('timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    if not file_id:
        return JsonResponse({'error': 'File ID is required'}, status=400)

    try:
        file = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return JsonResponse({'error': 'Invalid file ID'}, status=400)

    try:
        file_path = os.path.join(os.getenv('SECURE_PATH_FOR_FILES'), str(file_id))
        page_size = random.randint(100, 200)
        offset = (page_number - 1) * page_size

        records = []
        with open(file_path, 'r') as file:
            # Skip lines until offset
            for _ in range(offset):
                file.readline()

            # Read lines for the current page
            for _ in range(page_size):
                line = file.readline().strip()  # Strip to remove leading/trailing whitespace
                if not line:
                    break
                records.append({'query': line,  'timestamp': timestamp})

            queries = [record['query'] for record in records]
            X_seq = tokenizer_xss.texts_to_sequences(queries)
            X_pad = pad_sequences(X_seq, maxlen=max_len_xss, padding='post')
            predictions = model_xss.predict(X_pad)
            binary_predictions = (predictions > 0.5).astype(int).squeeze()

            # Add predictions to records
            for i, record in enumerate(records):
                record['prediction'] = int(binary_predictions[i])

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def detect_xss_injection(xss_query):
    xss_query = urllib.parse.unquote(xss_query)

    # Non-ASCII regex
    non_ascii_regex = re.compile(r'[^\x00-\x7F]')
    if non_ascii_regex.search(xss_query):
        return True

    # Keyword regex
    keyword_regex = re.compile(r'alert|<(/)?script(>)?|<marquee>|<br(/)?>', re.IGNORECASE)
    if keyword_regex.search(xss_query):
        return True

    # Count quotes
    if xss_query.count("'") % 2 != 0 or xss_query.count('"') % 2 != 0:
        return True

    # URL Pattern regex
    url_pattern_regex = re.compile(r'(url|host|site)=(?!(http|https)).*\.[a-zA-Z]{2,}', re.IGNORECASE)
    if url_pattern_regex.search(xss_query):
        return True

    src_exclusion_regex = re.compile(
        r'src="[^"]*(?<!\.(mp4|jpg|png|gif|svg|web|ogg|mp3|wav|pdf))(?<!\.(docx|xlsx|pptx|jpeg))"', re.IGNORECASE)
    if src_exclusion_regex.search(xss_query):
        return True

    return False

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_manual_selection(request):
    data = json.loads(request.body)
    path = data.get('path', None)
    model_attack = data.get('model_attack', None)

    if not path:
        return JsonResponse({'error': 'Path is required'}, status=400)

    if not model_attack:
        return JsonResponse({'error': 'Model attack is required'}, status=400)

    results = {
        'total_ai_predicted_1': 0,
        'total_ai_predicted_0': 0,
        'total_regex_predicted_1': 0,
        'total_regex_predicted_0': 0,
        'ai_confusion_matrix': None,
        'regex_confusion_matrix': None,
        'ai_accuracy': 0,
        'regex_accuracy': 0,
        'ai_f1_score': 0,
        'regex_f1_score': 0,
        'ai_recall': 0,
        'regex_recall': 0,
        'ai_precision': 0,
        'regex_precision': 0,
        'ai_time': 0,
        'regex_time': 0
    }

    try:
        with open(path, 'r') as file:
            queries = []
            true_labels = []
            for line in file:
                parts = line.rsplit(',', 1)
                if len(parts) != 2:
                    continue  # Skip lines that don't match the expected format
                query = parts[0].strip()
                is_attack = int(parts[1].strip())
                queries.append(query)
                true_labels.append(is_attack)

            # AI-based XSS Detection
            if model_attack == "XSS":
                start_time = time.time()
                X_seq = tokenizer_xss.texts_to_sequences(queries)
                X_pad = pad_sequences(X_seq, maxlen=max_len_xss, padding='post')
                predictions = model_xss.predict(X_pad)
                binary_predictions = (predictions > 0.5).astype(int).squeeze()
                results['ai_time'] = time.time() - start_time

                ai_true_labels = true_labels
                ai_predictions = binary_predictions.tolist()

                results['total_ai_predicted_1'] = sum(ai_predictions)
                results['total_ai_predicted_0'] = len(ai_predictions) - results['total_ai_predicted_1']

                # Regex-based XSS Detection
                start_time = time.time()
                regex_predictions = [int(detect_xss_injection(query)) for query in queries]
                results['regex_time'] = time.time() - start_time
            else:
                start_time = time.time()
                X_seq = tokenizer.texts_to_sequences(queries)
                X_pad = pad_sequences(X_seq, maxlen=max_len, padding='post')
                predictions = model.predict(X_pad)
                binary_predictions = (predictions > 0.5).astype(int).squeeze()
                results['ai_time'] = time.time() - start_time

                ai_true_labels = true_labels
                ai_predictions = binary_predictions.tolist()

                results['total_ai_predicted_1'] = sum(ai_predictions)
                results['total_ai_predicted_0'] = len(ai_predictions) - results['total_ai_predicted_1']

                # Regex-based XSS Detection
                start_time = time.time()
                regex_predictions = [int(detect_sql_injection(query)) for query in queries]
                results['regex_time'] = time.time() - start_time

            results['total_regex_predicted_1'] = sum(regex_predictions)
            results['total_regex_predicted_0'] = len(regex_predictions) - results['total_regex_predicted_1']

            # Calculate Metrics for AI
            results['ai_confusion_matrix'] = confusion_matrix(ai_true_labels, ai_predictions).tolist()
            results['ai_accuracy'] = accuracy_score(ai_true_labels, ai_predictions)
            results['ai_f1_score'] = f1_score(ai_true_labels, ai_predictions)
            results['ai_recall'] = recall_score(ai_true_labels, ai_predictions)
            results['ai_precision'] = precision_score(ai_true_labels, ai_predictions)

            # Calculate Metrics for Regex
            results['regex_confusion_matrix'] = confusion_matrix(true_labels, regex_predictions).tolist()
            results['regex_accuracy'] = accuracy_score(true_labels, regex_predictions)
            results['regex_f1_score'] = f1_score(true_labels, regex_predictions)
            results['regex_recall'] = recall_score(true_labels, regex_predictions)
            results['regex_precision'] = precision_score(true_labels, regex_predictions)

            # Size
            results['file_size'] = os.path.getsize(path)

        return JsonResponse(results, status=200)
    except FileNotFoundError:
        return JsonResponse({'error': 'File not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)