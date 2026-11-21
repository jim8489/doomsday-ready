from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import HealthCheckSerializer


class HealthCheckView(GenericAPIView):
    serializer_class = HealthCheckSerializer

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({
            "status": "ok",
            "service": "doomsday-ready-api",
            "version": "1.0.0",
        })