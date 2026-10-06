"""
0/1 knapsack four ways, plus a timing experiment.

Run:  python knapsack.py
It checks dynamic programming against brute force on random instances, shows how
often the greedy rule gets the wrong answer, then times brute force against DP.
"""
import random
import time


def brute_force(w, v, W):
    """Tries every subset. Theta(2^n)."""
    def go(i, room):
        if i == len(w):
            return 0
        best = go(i + 1, room)                              # skip item i
        if w[i] <= room:
            best = max(best, v[i] + go(i + 1, room - w[i]))  # take item i
        return best
    return go(0, W)


def dp_table(w, v, W):
    """Bottom-up table. Returns (best value, chosen item indices). Theta(nW) time and space."""
    n = len(w)
    K = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for c in range(W + 1):
            K[i][c] = K[i - 1][c]
            if w[i - 1] <= c:
                K[i][c] = max(K[i][c], v[i - 1] + K[i - 1][c - w[i - 1]])
    chosen, c = [], W
    for i in range(n, 0, -1):                               # walk back through the table
        if K[i][c] != K[i - 1][c]:
            chosen.append(i - 1)
            c -= w[i - 1]
    return K[n][W], chosen[::-1]


def dp_one_row(w, v, W):
    """Same answer in Theta(W) space. Capacities go right to left so each item is used once."""
    K = [0] * (W + 1)
    for wi, vi in zip(w, v):
        for c in range(W, wi - 1, -1):
            K[c] = max(K[c], vi + K[c - wi])
    return K[W]


def greedy(w, v, W):
    """Best value-per-weight first. Fast, but not always right for 0/1 knapsack."""
    total = 0
    for i in sorted(range(len(w)), key=lambda i: v[i] / w[i], reverse=True):
        if w[i] <= W:
            W -= w[i]
            total += v[i]
    return total


def instance(n, rng, maxw=12, maxv=30):
    return [rng.randint(1, maxw) for _ in range(n)], [rng.randint(1, maxv) for _ in range(n)]


def check():
    w, v = [1, 3, 4, 5], [1, 4, 5, 7]                        # the worked example from the blog
    assert dp_table(w, v, 7) == (9, [1, 2]) and greedy(w, v, 7) == 8
    rng, wrong, trials = random.Random(1), 0, 2000
    for _ in range(trials):
        n = rng.randint(1, 12)
        w, v = instance(n, rng)
        W = rng.randint(1, 40)
        best = brute_force(w, v, W)
        val, chosen = dp_table(w, v, W)
        assert val == best == dp_one_row(w, v, W)
        assert sum(w[i] for i in chosen) <= W and sum(v[i] for i in chosen) == best
        wrong += greedy(w, v, W) != best
    print(f"correctness checks passed; greedy was wrong on {wrong} of {trials} random instances ({100 * wrong / trials:.0f}%)")


def experiment(sizes=(10, 14, 18, 20, 22), W=60):
    # light items and a roomy sack, so almost every subset fits and brute force gets no lucky pruning
    rng = random.Random(9)
    rows = []
    print(f"{'n':>4} {'subsets 2^n':>12} {'table cells nW':>15} {'brute ms':>10} {'DP ms':>8}")
    for n in sizes:
        w, v = instance(n, rng, maxw=4)
        t = time.perf_counter(); a = brute_force(w, v, W); tb = (time.perf_counter() - t) * 1000
        t = time.perf_counter(); b = dp_one_row(w, v, W); td = (time.perf_counter() - t) * 1000
        assert a == b
        rows.append((n, 2 ** n, n * W, tb, td))
        print(f"{n:>4} {2 ** n:>12} {n * W:>15} {tb:>10.1f} {td:>8.2f}")
    return rows


if __name__ == "__main__":
    check()
    experiment()
