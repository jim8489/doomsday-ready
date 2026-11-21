
from rest_framework import mixins, serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
)

from apps.cinemas.models import Cinema

from .serializers import (
    CinemaSerializer,
    BookingQuoteSerializer,
)

from .services.booking_optimizer import (
    calculate_booking_quote,
)


class CinemaViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CinemaSerializer

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def get_queryset(self):
        return Cinema.objects.prefetch_related(
            "bundles"
        ).all()

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="groupSize",
                type=int,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Number of people in the watch party (1–10,000).",
            )
        ],
        responses=BookingQuoteSerializer,
        description=(
            "Calculates the minimum number of cinema bundles "
            "required to accommodate the group exactly."
        ),
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="booking",
    )
    def booking(self, request, pk=None):
        cinema = self.get_object()

        raw_group_size = request.query_params.get("groupSize")

        if raw_group_size is None:
            raise ValidationError({
                "groupSize": "This query parameter is required."
            })

        group_size_field = serializers.IntegerField(
            min_value=1,
            max_value=10_000,
        )

        group_size = group_size_field.run_validation(
            raw_group_size
        )

        quote = calculate_booking_quote(
            bundle_sizes=cinema.bundle_sizes,
            group_size=group_size,
        )

        response_serializer = BookingQuoteSerializer(
            instance=quote
        )

        return Response(response_serializer.data)
