from rest_framework.response import Response
from rest_framework.views import APIView

class HealthAPIView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"ok": True, "service": "backend"})
