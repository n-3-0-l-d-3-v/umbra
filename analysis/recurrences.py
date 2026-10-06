"""
Recurrences checked by brute force.

Run:  python recurrences.py
Part 1 evaluates three divide-and-conquer recurrences exactly and compares them with
what the Master Theorem predicts. Part 2 counts the single-digit multiplications made
by Karatsuba's algorithm and by the schoolbook method.
"""
import math
from functools import lru_cache


def make(a, b, f):
    """T(n) = a*T(n/b) + f(n), T(1) = 1, for n a power of b."""
    @lru_cache(maxsize=None)
    def T(n):
        return 1 if n <= 1 else a * T(n // b) + f(n)
    return T


CASES = [
    ("T(n) = 3T(n/2) + n", make(3, 2, lambda n: n), lambda n: n ** math.log2(3), "n^1.585"),
    ("T(n) = 2T(n/2) + n", make(2, 2, lambda n: n), lambda n: n * math.log2(n), "n log2 n"),
    ("T(n) = T(n/2) + n",  make(1, 2, lambda n: n), lambda n: n,                "n"),
]


def part1(powers=(4, 8, 12, 16, 20)):
    rows = []
    for name, T, g, label in CASES:
        print(f"\n{name}   predicted Theta({label})")
        print(f"{'n':>9} {'exact T(n)':>16} {'T(n) / prediction':>18}")
        for k in powers:
            n = 2 ** k
            rows.append((name, n, T(n), T(n) / g(n)))
            print(f"{n:>9} {T(n):>16} {T(n) / g(n):>18.3f}")
    return rows


def karatsuba(x, y, n, count):
    """Multiplies two n-digit numbers (n a power of 2). count[0] tallies 1-digit multiplications."""
    if n == 1:
        count[0] += 1
        return x * y
    h = n // 2
    p = 10 ** h
    a, b, c, d = x // p, x % p, y // p, y % p
    ac = karatsuba(a, c, h, count)
    bd = karatsuba(b, d, h, count)
    # (a + b) and (c + d) can carry into one extra digit; split the carry off so sizes stay at h
    s, t = a + b, c + d
    cross = karatsuba(s % p, t % p, h, count) + (s // p) * (t % p) * p + (t // p) * (s % p) * p + (s // p) * (t // p) * p * p
    return ac * p * p + (cross - ac - bd) * p + bd


def part2(sizes=(4, 8, 16, 32, 64, 128, 256)):
    import random
    random.seed(5)
    rows = []
    print(f"\n{'digits':>7} {'schoolbook n^2':>15} {'Karatsuba':>10} {'3^log2(n)':>10} {'saving':>8}")
    for n in sizes:
        x, y = random.randrange(10 ** (n - 1), 10 ** n), random.randrange(10 ** (n - 1), 10 ** n)
        c = [0]
        assert karatsuba(x, y, n, c) == x * y
        rows.append((n, n * n, c[0]))
        print(f"{n:>7} {n * n:>15} {c[0]:>10} {3 ** int(math.log2(n)):>10} {n * n / c[0]:>7.1f}x")
    return rows


if __name__ == "__main__":
    part1()
    part2()
