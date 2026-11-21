
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from apps.movies.models import Movie
from apps.movies.serializers import MovieSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from apps.movies.serializers import RewatchPlanSerializer
from apps.movies.services.rewatch_service import build_rewatch_plan


class MovieViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MovieSerializer
    permission_classes = [AllowAny]

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]

    def get_queryset(self):
        return Movie.objects.prefetch_related(
            "prerequisites"
        ).all()
    @extend_schema(
        responses=RewatchPlanSerializer,
        description=(
            "Returns all direct and indirect prerequisites "
            "in a valid watch order, excluding the target movie."
        ),
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="rewatch-order",
    )
    def rewatch_order(self, request, pk=None):
        target = self.get_object()

        plan = build_rewatch_plan(target)

        serializer = RewatchPlanSerializer(
            instance=plan
        )

        return Response(serializer.data)