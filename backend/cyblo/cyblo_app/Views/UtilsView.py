from django.shortcuts import get_object_or_404
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
