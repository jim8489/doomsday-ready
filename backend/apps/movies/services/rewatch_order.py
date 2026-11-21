from collections import defaultdict
from heapq import heappop, heappush
from collections.abc import Hashable, Iterable, Mapping


def calculate_rewatch_order(
    target_id: Hashable,
    prerequisites_by_movie: Mapping[
        Hashable, Iterable[Hashable]
    ],
    title_by_id: Mapping[Hashable, str],
) -> list[Hashable]:
    """
    Calculate a deterministic prerequisite-first rewatch order.

    Prerequisite mapping:
        dependent_movie -> prerequisite_movies

    The target is excluded from the returned list.

    Algorithm:
        1. Iterative DFS to find the prerequisite closure.
        2. Kahn's algorithm to topologically sort the closure.
        3. Min-heap to ensure deterministic ordering.

    Time complexity:
        O(V + E + V log V)

    Space complexity:
        O(V + E)
    """

    if target_id not in title_by_id:
        raise KeyError(f"Unknown target movie: {target_id}")

    # STEP 1: Find all reachable prerequisites using iterative DFS.

    relevant_movies = {target_id}
    stack = [target_id]

    while stack:
        current_movie = stack.pop()

        for prerequisite in prerequisites_by_movie.get(
            current_movie, ()
        ):
            if prerequisite not in title_by_id:
                raise ValueError(
                    f"Unknown prerequisite movie: {prerequisite}"
                )

            if prerequisite not in relevant_movies:
                relevant_movies.add(prerequisite)
                stack.append(prerequisite)

    # STEP 2: Construct the subgraph for topological sorting.

    indegree = {
        movie_id: 0
        for movie_id in relevant_movies
    }

    dependents = defaultdict(list)

    for dependent in relevant_movies:
        prerequisites = set(
            prerequisites_by_movie.get(dependent, ())
        )

        for prerequisite in prerequisites:
            if prerequisite not in relevant_movies:
                continue

            # prerequisite -> dependent
            indegree[dependent] += 1
            dependents[prerequisite].append(dependent)

    # STEP 3: Initialize a min-heap with zero-indegree movies.
    # Title is the primary ordering key; ID breaks ties.

    ready = []

    for movie_id, degree in indegree.items():
        if degree == 0:
            heappush(
                ready,
                (
                    title_by_id[movie_id].casefold(),
                    str(movie_id),
                    movie_id,
                ),
            )

    # STEP 4: Kahn's topological sorting.

    ordered_movies = []

    while ready:
        _, _, current_movie = heappop(ready)

        ordered_movies.append(current_movie)

        for dependent in dependents[current_movie]:
            indegree[dependent] -= 1

            if indegree[dependent] == 0:
                heappush(
                    ready,
                    (
                        title_by_id[dependent].casefold(),
                        str(dependent),
                        dependent,
                    ),
                )

    # STEP 5: Defensive cycle detection.

    if len(ordered_movies) != len(relevant_movies):
        raise ValueError(
            "The prerequisite graph contains a circular dependency."
        )

    # STEP 6: Exclude the target movie.

    return [
        movie_id
        for movie_id in ordered_movies
        if movie_id != target_id
    ]