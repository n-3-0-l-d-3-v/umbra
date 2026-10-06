"""
Dijkstra's algorithm two ways, plus a timing experiment.

Run:  python dijkstra.py
It checks a min-heap version against a simple array version on random graphs,
then times both as the graph grows.
"""
import heapq
import random
import time

INF = float("inf")


def dijkstra_heap(adj, s):
    """adj[u] = list of (v, w). Returns (dist, prev). O((V + E) log V)."""
    dist, prev = [INF] * len(adj), [None] * len(adj)
    dist[s] = 0
    heap = [(0, s)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue                   # stale entry: u was already settled with a smaller distance
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:           # relaxation
                dist[v], prev[v] = nd, u
                heapq.heappush(heap, (nd, v))
    return dist, prev


def dijkstra_array(adj, s):
    """Same result, but finds the closest unsettled node by scanning. O(V^2)."""
    n = len(adj)
    dist, prev, done = [INF] * n, [None] * n, [False] * n
    dist[s] = 0
    for _ in range(n):
        u, best = -1, INF
        for i in range(n):
            if not done[i] and dist[i] < best:
                u, best = i, dist[i]
        if u < 0:
            break                      # everything left is unreachable
        done[u] = True
        for v, w in adj[u]:
            if best + w < dist[v]:
                dist[v], prev[v] = best + w, u
    return dist, prev


def path(prev, t):
    out = []
    while t is not None:
        out.append(t)
        t = prev[t]
    return out[::-1]


def random_graph(n, m, seed):
    rng = random.Random(seed)
    adj = [[] for _ in range(n)]
    for v in range(1, n):              # a random spanning tree keeps the graph connected
        u = rng.randrange(v)
        w = rng.randint(1, 20)
        adj[u].append((v, w)); adj[v].append((u, w))
    for _ in range(m - (n - 1)):
        u, v, w = rng.randrange(n), rng.randrange(n), rng.randint(1, 20)
        if u != v:
            adj[u].append((v, w)); adj[v].append((u, w))
    return adj


def check():
    # the worked example from the blog: A..F = 0..5
    edges = [(0, 1, 4), (0, 2, 2), (1, 2, 1), (1, 3, 5), (2, 3, 8), (2, 4, 10), (3, 4, 2), (3, 5, 6), (4, 5, 3)]
    adj = [[] for _ in range(6)]
    for u, v, w in edges:
        adj[u].append((v, w)); adj[v].append((u, w))
    dist, prev = dijkstra_heap(adj, 0)
    assert dist == [0, 3, 2, 8, 10, 13], dist
    assert path(prev, 5) == [0, 2, 1, 3, 4, 5]
    for seed in range(200):
        n = random.Random(seed).randint(2, 60)
        g = random_graph(n, 3 * n, seed)
        assert dijkstra_heap(g, 0)[0] == dijkstra_array(g, 0)[0]
    print("correctness checks passed")


def experiment(sizes=(500, 1000, 2000, 4000), seed=3):
    rows = []
    print(f"{'V':>6} {'E':>7} {'heap ms':>9} {'array ms':>10} {'speed-up':>9}")
    for n in sizes:
        g = random_graph(n, 4 * n, seed)
        t = time.perf_counter(); a = dijkstra_heap(g, 0)[0]; th = (time.perf_counter() - t) * 1000
        t = time.perf_counter(); b = dijkstra_array(g, 0)[0]; ta = (time.perf_counter() - t) * 1000
        assert a == b
        rows.append((n, 4 * n, th, ta))
        print(f"{n:>6} {4 * n:>7} {th:>9.1f} {ta:>10.1f} {ta / th:>8.0f}x")
    return rows


if __name__ == "__main__":
    check()
    experiment()
