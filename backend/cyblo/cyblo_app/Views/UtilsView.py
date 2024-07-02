import json
import os
import pickle
import time
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

from cyblo.cyblo_app.Views.RegexViewSQLi import detect_sql_injection
from cyblo.cyblo_app.Views.RegexViewXSS import detect_xss_injection
from cyblo.cyblo_app.models import Project, ExternalDBConnection, File
from cyblo.cyblo_app.serializers import ExternalDBConnectionSerializer
from sklearn.metrics import confusion_matrix, accuracy_score, f1_score, recall_score, precision_score


# Bi-LSTM SQL
with open('models/tokenizer_sql.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)
model = load_model('models/best_model.h5')
max_len = 544

# Bi-LSTM XSS
with open('models/tokenizer_xss.pickle', 'rb') as handle:
    tokenizer_xss = pickle.load(handle)
model_xss = load_model('models/best_model_xss_hard_dataset.h5')
max_len_xss = 606

# Random Forest SQLI
with open('models/vectorizer_sqli.pickle', 'rb') as handle:
    vectorizer_sql = pickle.load(handle)

with open('models/best_random_forest_sqli_model.pickle', 'rb') as handle:
    model_sql_random_forest = pickle.load(handle)

# Random Forest XSS
with open('models/vectorizer_xss.pickle', 'rb') as handle:
    vectorizer_xss = pickle.load(handle)

with open('models/random_forest_xss_model.pickle', 'rb') as handle:
    model_xss_random_forest = pickle.load(handle)



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
        'total_bilstm_predicted_1': 0,
        'total_bilstm_predicted_0': 0,
        'total_random_forest_predicted_1': 0,
        'total_random_forest_predicted_0': 0,
        'total_regex_predicted_1': 0,
        'total_regex_predicted_0': 0,
        'bilstm_confusion_matrix': None,
        'random_forest_confusion_matrix': None,
        'regex_confusion_matrix': None,
        'bilstm_accuracy': 0,
        'random_forest_accuracy': 0,
        'regex_accuracy': 0,
        'bilstm_f1_score': 0,
        'random_forest_f1_score': 0,
        'regex_f1_score': 0,
        'bilstm_recall': 0,
        'random_forest_recall': 0,
        'regex_recall': 0,
        'bilstm_precision': 0,
        'random_forest_precision': 0,
        'regex_precision': 0,
        'bilstm_time': 0,
        'random_forest_time': 0,
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
                try:
                    is_attack = int(parts[1].strip())
                    if is_attack not in (0, 1):
                        continue  # Skip lines where the label is not 0 or 1
                except ValueError:
                    continue  # Skip lines where the label is not an integer
                queries.append(query)
                true_labels.append(is_attack)

            # AI-based XSS Detection
            if model_attack == "XSS":
                #Bi-LSTM Based XSS Detection

                start_time = time.time()
                X_seq = tokenizer_xss.texts_to_sequences(queries)
                X_pad = pad_sequences(X_seq, maxlen=max_len_xss, padding='post')
                predictions = model_xss.predict(X_pad)
                binary_predictions = (predictions > 0.5).astype(int).squeeze()
                results['bilstm_time'] = time.time() - start_time

                bilstm_predictions = binary_predictions.tolist()

                results['total_bilstm_predicted_1'] = sum(bilstm_predictions)
                results['total_bilstm_predicted_0'] = len(bilstm_predictions) - results['total_bilstm_predicted_1']

                # Random Forests based xss detection

                start_time = time.time()

                X_tfidf = vectorizer_xss.transform(queries)
                predictions = model_xss_random_forest.predict(X_tfidf)

                results['random_forest_time'] = time.time() - start_time

                ai_true_labels = true_labels
                random_forest_predictions = predictions.tolist()

                results['total_random_forest_predicted_1'] = sum(random_forest_predictions)
                results['total_random_forest_predicted_0'] = len(random_forest_predictions) - results['total_random_forest_predicted_1']

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
                results['bilstm_time'] = time.time() - start_time

                bilstm_predictions = binary_predictions.tolist()

                results['total_bilstm_predicted_1'] = sum(bilstm_predictions)
                results['total_bilstm_predicted_0'] = len(bilstm_predictions) - results['total_bilstm_predicted_1']

                # Regex-based XSS Detection
                start_time = time.time()

                X_tfidf = vectorizer_sql.transform(queries)
                predictions = model_sql_random_forest.predict(X_tfidf)

                results['random_forest_time'] = time.time() - start_time

                ai_true_labels = true_labels
                random_forest_predictions = predictions.tolist()

                results['total_random_forest_predicted_1'] = sum(random_forest_predictions)
                results['total_random_forest_predicted_0'] = len(random_forest_predictions) - results['total_random_forest_predicted_1']

                # Regex-based XSS Detection
                start_time = time.time()
                regex_predictions = [int(detect_sql_injection(query)) for query in queries]
                results['regex_time'] = time.time() - start_time

            results['total_regex_predicted_1'] = sum(regex_predictions)
            results['total_regex_predicted_0'] = len(regex_predictions) - results['total_regex_predicted_1']

            # Calculate Metrics for AI
            results['bilstm_confusion_matrix'] = confusion_matrix(ai_true_labels, bilstm_predictions).tolist()
            results['bilstm_accuracy'] = accuracy_score(ai_true_labels, bilstm_predictions)
            results['bilstm_f1_score'] = f1_score(ai_true_labels, bilstm_predictions)
            results['bilstm_recall'] = recall_score(ai_true_labels, bilstm_predictions)
            results['bilstm_precision'] = precision_score(ai_true_labels, bilstm_predictions)

            # Calculate Metrics for Random Forests
            results['random_forest_confusion_matrix'] = confusion_matrix(ai_true_labels, random_forest_predictions).tolist()
            results['random_forest_accuracy'] = accuracy_score(ai_true_labels, random_forest_predictions)
            results['random_forest_f1_score'] = f1_score(ai_true_labels, random_forest_predictions)
            results['random_forest_recall'] = recall_score(ai_true_labels, random_forest_predictions)
            results['random_forest_precision'] = precision_score(ai_true_labels, random_forest_predictions)

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
