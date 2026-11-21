
def calculate_booking_quote(
    bundle_sizes: list[int],
    group_size: int,
) -> dict:
    """
    Calculate the minimum number of cinema bundles needed
    to accommodate a group exactly.

    This is an unbounded minimum coin-change problem:
    each bundle size can be used any number of times.

    Args:
        bundle_sizes: Available bundle sizes (1 to 500).
        group_size: Required seats (1 to 10,000).

    Returns:
        {
            "possible": bool,
            "group_size": int,
            "total_bundles": int | None,
            "bundles": [
                {"size": int, "count": int}
            ]
        }

    Time complexity: O(G * B)
    Space complexity: O(G)

    G = group size
    B = number of available bundle sizes
    """

    # 1. Validate group size.
    if (
        type(group_size) is not int
        or not 1 <= group_size <= 10_000
    ):
        raise ValueError(
            "Group size must be an integer between 1 and 10,000."
        )

    # 2. Validate bundle sizes.
    if not isinstance(bundle_sizes, (list, tuple)):
        raise ValueError("Bundle sizes must be a list or tuple.")

    if not 1 <= len(bundle_sizes) <= 10:
        raise ValueError(
            "A cinema must have between 1 and 10 bundle sizes."
        )

    if any(
        type(size) is not int or not 1 <= size <= 500
        for size in bundle_sizes
    ):
        raise ValueError(
            "Every bundle size must be an integer between 1 and 500."
        )

    if len(bundle_sizes) != len(set(bundle_sizes)):
        raise ValueError("Duplicate bundle sizes are not allowed.")

    # Sorting provides deterministic tie-breaking.
    sizes = sorted(bundle_sizes)

    # 3. Initialize dynamic programming arrays.
    #
    # dp[x] stores the minimum number of bundles
    # needed to make exactly x seats.
    #
    # chosen_bundle[x] stores the last bundle size
    # selected in the optimal solution for x seats.

    unreachable = group_size + 1

    dp = [unreachable] * (group_size + 1)
    chosen_bundle = [None] * (group_size + 1)

    dp[0] = 0

    # 4. Calculate optimal bundle counts.
    for seats in range(1, group_size + 1):

        for bundle_size in sizes:

            if bundle_size > seats:
                break

            previous_count = dp[seats - bundle_size]

            if previous_count == unreachable:
                continue

            candidate_count = previous_count + 1

            if candidate_count < dp[seats]:
                dp[seats] = candidate_count
                chosen_bundle[seats] = bundle_size

    # 5. Check whether an exact combination exists.
    if dp[group_size] == unreachable:
        return {
            "possible": False,
            "group_size": group_size,
            "total_bundles": None,
            "bundles": [],
        }

    # 6. Reconstruct the optimal bundle combination.
    bundle_counts = {}
    remaining_seats = group_size

    while remaining_seats > 0:

        bundle_size = chosen_bundle[remaining_seats]

        if bundle_size is None:
            raise RuntimeError(
                "Unable to reconstruct the booking solution."
            )

        bundle_counts[bundle_size] = (
            bundle_counts.get(bundle_size, 0) + 1
        )

        remaining_seats -= bundle_size

    # 7. Return a deterministic, readable response.
    bundles = [
        {
            "size": size,
            "count": bundle_counts[size],
        }
        for size in sorted(bundle_counts, reverse=True)
    ]

    return {
        "possible": True,
        "group_size": group_size,
        "total_bundles": dp[group_size],
        "bundles": bundles,
    }
