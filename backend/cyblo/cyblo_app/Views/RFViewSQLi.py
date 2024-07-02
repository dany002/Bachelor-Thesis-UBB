import json
import os
import pickle
import random
from datetime import datetime, timedelta
import psycopg2
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from cyblo.cyblo_app.models import ExternalDBConnection, File

# Random SQLI
with open('models/vectorizer_sqli.pickle', 'rb') as handle:
    vectorizer_sql = pickle.load(handle)

with open('models/best_random_forest_sqli_model.pickle', 'rb') as handle:
    model_sql_random_forest = pickle.load(handle)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_records_with_random_forests_sql(request):
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
        X_tfidf = vectorizer_sql.transform(queries)
        predictions = model_sql_random_forest.predict(X_tfidf)

        # Add predictions to records
        for i, record in enumerate(records):
            record['prediction'] = int(predictions[i])

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_file_sql_random(request, file_id):
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
                records.append({'query': line, 'timestamp': timestamp})

            # Preprocess and predict
            queries = [record['query'] for record in records]
            X_tfidf = vectorizer_sql.transform(queries)
            predictions = model_sql_random_forest.predict(X_tfidf)

            # Add predictions to records
            for i, record in enumerate(records):
                record['prediction'] = int(predictions[i])

        return JsonResponse({'records': records})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
