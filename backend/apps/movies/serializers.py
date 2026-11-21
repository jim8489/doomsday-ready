
from rest_framework import serializers

from apps.movies.models import Movie

from .exceptions import CircularDependencyConflict
from .services.movie_service import (
    CircularDependencyError,
    DuplicateMovieTitleError,
    create_movie,
    update_movie,
)


class MovieSerializer(serializers.ModelSerializer):

    prerequisites = serializers.PrimaryKeyRelatedField(
        queryset=Movie.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Movie

        fields = [
            "id",
            "title",
            "release_year",
            "runtime_minutes",
            "watched",
            "prerequisites",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Movie title cannot be empty."
            )

        queryset = Movie.objects.filter(title__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A movie with this title already exists."
            )

        return value

    def validate_prerequisites(self, value):
        prerequisite_ids = [
            movie.pk for movie in value
        ]

        if len(prerequisite_ids) != len(set(prerequisite_ids)):
            raise serializers.ValidationError(
                "Duplicate prerequisites are not allowed."
            )

        # Self-dependencies and indirect cycles are intentionally
        # handled by the graph service, returning HTTP 409.
        return value

    def create(self, validated_data):
        try:
            return create_movie(validated_data)

        except CircularDependencyError as error:
            raise CircularDependencyConflict() from error

        except DuplicateMovieTitleError as error:
            raise serializers.ValidationError({
                "title": str(error)
            }) from error

    def update(self, instance, validated_data):
        try:
            return update_movie(instance, validated_data)

        except CircularDependencyError as error:
            raise CircularDependencyConflict() from error

        except DuplicateMovieTitleError as error:
            raise serializers.ValidationError({
                "title": str(error)
            }) from error
class RewatchMovieSerializer(serializers.ModelSerializer):

    class Meta:
        model = Movie

        fields = [
            "id",
            "title",
            "release_year",
            "runtime_minutes",
            "watched",
        ]


class RewatchPlanSerializer(serializers.Serializer):

    target = RewatchMovieSerializer()

    movies = RewatchMovieSerializer(
        many=True
    )

    total_movies = serializers.IntegerField()

    watched_count = serializers.IntegerField()

    remaining_runtime_minutes = serializers.IntegerField()