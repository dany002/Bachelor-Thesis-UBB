from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cyblo.cyblo_app.models import Project
from cyblo.cyblo_app.permissions import IsOwner
from cyblo.cyblo_app.serializers import ProjectSerializer

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
    request.data['user'] = request.user.id
    serializer = ProjectSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except Exception as e:
        print(e)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)