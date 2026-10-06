"""
Binary search, plus an experiment that counts probes.

Run:  python binary_search.py
It checks the implementation against Python's bisect module, then prints how many
probes binary search needs as n grows, next to what a linear scan would need.
"""
import bisect
import math
import random


def binary_search(a, t):
    """Returns (index of t in sorted list a, or -1 if absent, number of probes used)."""
    lo, hi, probes = 0, len(a) - 1, 0
    while lo <= hi:
        mid = lo + (hi - lo) // 2      # same as (lo + hi) // 2, but cannot overflow in C/Java
        probes += 1
        if a[mid] == t:
            return mid, probes
        if a[mid] < t:
            lo = mid + 1               # t can only be to the right of mid
        else:
            hi = mid - 1               # t can only be to the left of mid
    return -1, probes


def check():
    for n in list(range(0, 60)) + [1000]:
        a = sorted(random.sample(range(5 * n + 10), n))
        for t in range(-1, 5 * n + 11):
            i, _ = binary_search(a, t)
            j = bisect.bisect_left(a, t)
            present = j < n and a[j] == t
            assert (i == j) if present else (i == -1), (a, t, i)
    print("correctness checks passed")


def experiment(sizes=(10**3, 10**4, 10**5, 10**6, 10**7), trials=2000, seed=11):
    random.seed(seed)
    rows = []
    print(f"{'n':>10} {'worst probes':>13} {'floor(log2 n)+1':>16} {'avg probes':>11} {'linear avg':>11}")
    for n in sizes:
        a = range(0, 2 * n, 2)         # sorted even numbers; range supports indexing, so no giant list
        worst = max(binary_search(a, t)[1] for t in (a[0], a[-1], -1, 2 * n + 1, 1, 2 * n - 1))
        total = 0
        for _ in range(trials):
            total += binary_search(a, a[random.randrange(n)])[1]
        avg = total / trials
        bound = math.floor(math.log2(n)) + 1
        rows.append((n, worst, bound, avg, (n + 1) / 2))
        print(f"{n:>10} {worst:>13} {bound:>16} {avg:>11.2f} {(n + 1) / 2:>11.0f}")
    return rows


if __name__ == "__main__":
    check()
    experiment()
