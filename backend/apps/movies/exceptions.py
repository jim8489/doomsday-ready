
from rest_framework.exceptions import APIException


class CircularDependencyConflict(APIException):
    status_code = 409
    default_code = "CIRCULAR_DEPENDENCY"

    def __init__(self):
        super().__init__(
            {
                "code": "CIRCULAR_DEPENDENCY",
                "detail": (
                    "This prerequisite would create "
                    "a circular dependency."
                ),
            }
        )
