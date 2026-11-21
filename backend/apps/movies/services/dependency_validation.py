
from collections import deque
from collections.abc import Hashable, Iterable, Mapping


def has_circular_dependency(
    dependencies: Mapping[Hashable, Iterable[Hashable]],
) -> bool:
    """
    Detect cycles in a directed movie dependency graph.

    Mapping direction:
        dependent_movie -> prerequisite_movies

    Returns:
        True if the graph contains a cycle.
        False if the graph is acyclic.

    Time complexity: O(V + E)
    Space complexity: O(V + E)
    """

    # Include every movie, including prerequisite-only nodes.
    nodes = set(dependencies)

    normalized_dependencies = {}

    for dependent, prerequisites in dependencies.items():
        unique_prerequisites = set(prerequisites)

        normalized_dependencies[dependent] = unique_prerequisites
        nodes.update(unique_prerequisites)

    indegree = {node: 0 for node in nodes}


    dependents = {node: [] for node in nodes}

    for dependent, prerequisites in normalized_dependencies.items():
        for prerequisite in prerequisites:

            # A movie cannot depend on itself.
            if dependent == prerequisite:
                return True

            indegree[dependent] += 1
            dependents[prerequisite].append(dependent)

    # Start with movies that have no prerequisites.
    queue = deque(
        node
        for node, degree in indegree.items()
        if degree == 0
    )

    processed_count = 0

    while queue:
        prerequisite = queue.popleft()
        processed_count += 1

        for dependent in dependents[prerequisite]:
            indegree[dependent] -= 1

            if indegree[dependent] == 0:
                queue.append(dependent)

    # An acyclic graph allows every node to be processed.
    return processed_count != len(nodes)
