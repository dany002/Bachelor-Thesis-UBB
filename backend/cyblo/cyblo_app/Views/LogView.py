from rest_framework import generics
from cyblo.cyblo_app.models import Log
from cyblo.cyblo_app.serializers import LogSerializer


class LogList(generics.ListCreateAPIView):
    queryset = Log.objects.all()
    serializer_class = LogSerializer


class LogDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
