from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
