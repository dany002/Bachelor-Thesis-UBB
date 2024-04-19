from rest_framework import generics
from cyblo.cyblo_app.models import File
from cyblo.cyblo_app.serializers import FileSerializer


class FileList(generics.ListCreateAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer


class FileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer
