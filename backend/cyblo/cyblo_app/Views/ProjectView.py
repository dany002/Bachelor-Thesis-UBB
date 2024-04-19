from rest_framework import generics
from cyblo.cyblo_app.models import Project
from cyblo.cyblo_app.serializers import ProjectSerializer

class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer