
from rest_framework import serializers

from apps.cinemas.models import Cinema

from .services.cinema_service import (
    DuplicateCinemaNameError,
    create_cinema,
)


class CinemaSerializer(serializers.ModelSerializer):

    bundle_sizes = serializers.ListField(
        child=serializers.IntegerField(
            min_value=1,
            max_value=500,
        ),
        min_length=1,
        max_length=10,
    )

    class Meta:
        model = Cinema

        fields = [
            "id",
            "name",
            "bundle_sizes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Cinema name cannot be empty."
            )

        if Cinema.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "A cinema with this name already exists."
            )

        return value

    def validate_bundle_sizes(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "Bundle sizes must be unique."
            )

        return value

    def create(self, validated_data):
        try:
            return create_cinema(
                name=validated_data["name"],
                bundle_sizes=validated_data["bundle_sizes"],
            )

        except DuplicateCinemaNameError as error:
            raise serializers.ValidationError({
                "name": str(error)
            }) from error

        except ValueError as error:
            raise serializers.ValidationError({
                "bundle_sizes": str(error)
            }) from error
class BundleAllocationSerializer(serializers.Serializer):
    size = serializers.IntegerField()
    count = serializers.IntegerField()


class BookingQuoteSerializer(serializers.Serializer):
    possible = serializers.BooleanField()
    group_size = serializers.IntegerField()
    total_bundles = serializers.IntegerField(
        allow_null=True
    )
    bundles = BundleAllocationSerializer(many=True)