"""
Merge sort, plus a small experiment that counts comparisons.

Run:  python merge_sort.py
It checks the implementation against Python's sorted() on random inputs,
then prints how many comparisons merge sort and insertion sort make as n grows.
"""
import math
import random
import time


def merge_sort(a):
    """Sorts list a in place. Returns the number of element comparisons made."""
    buf = a[:]            # one scratch buffer for the whole sort, not one per call
    return _sort(a, buf, 0, len(a) - 1)


def _sort(a, buf, l, r):
    if l >= r:
        return 0
    m = l + (r - l) // 2  # same as (l + r) // 2, but safe from overflow in C/Java
    c = _sort(a, buf, l, m)
    c += _sort(a, buf, m + 1, r)
    return c + _merge(a, buf, l, m, r)


def _merge(a, buf, l, m, r):
    buf[l:r + 1] = a[l:r + 1]
    i, j, k, c = l, m + 1, l, 0
    while i <= m and j <= r:
        c += 1
        if buf[i] <= buf[j]:   # <= (not <) keeps equal keys in original order: stable
            a[k] = buf[i]; i += 1
        else:
            a[k] = buf[j]; j += 1
        k += 1
    # only one of these two loops actually runs
    while i <= m:
        a[k] = buf[i]; i += 1; k += 1
    while j <= r:
        a[k] = buf[j]; j += 1; k += 1
    return c


def insertion_sort(a):
    c = 0
    for i in range(1, len(a)):
        x, j = a[i], i - 1
        while j >= 0:
            c += 1
            if a[j] <= x:
                break
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = x
    return c


def check():
    for n in list(range(0, 40)) + [100, 1000]:
        for _ in range(20):
            a = [random.randint(0, 50) for _ in range(n)]
            b = a[:]
            merge_sort(b)
            assert b == sorted(a), (a, b)
    # stability: sort (key, original_index) pairs by key only
    pairs = [(random.randint(0, 5), i) for i in range(500)]
    keys = [Key(k, i) for k, i in pairs]
    merge_sort(keys)
    for x, y in zip(keys, keys[1:]):
        assert x.k < y.k or (x.k == y.k and x.i < y.i)
    print("correctness + stability checks passed")


class Key:
    """Compares on k only, so equal keys expose whether order is preserved."""
    def __init__(self, k, i): self.k, self.i = k, i
    def __le__(self, o): return self.k <= o.k


def experiment(sizes=(1000, 2000, 4000, 8000, 16000, 32000, 64000), seed=7):
    random.seed(seed)
    rows = []
    print(f"{'n':>7} {'merge cmps':>11} {'n log2 n':>11} {'ratio':>6} {'insertion cmps':>15} {'merge ms':>9}")
    for n in sizes:
        data = [random.random() for _ in range(n)]
        a = data[:]
        t = time.perf_counter()
        mc = merge_sort(a)
        ms = (time.perf_counter() - t) * 1000
        ic = insertion_sort(data[:]) if n <= 8000 else None   # quadratic, gets slow fast
        nlg = n * math.log2(n)
        rows.append((n, mc, nlg, ic, ms))
        print(f"{n:>7} {mc:>11} {nlg:>11.0f} {mc / nlg:>6.3f} {ic if ic else '-':>15} {ms:>9.1f}")
    return rows


if __name__ == "__main__":
    check()
    experiment()
