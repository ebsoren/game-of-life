#!/usr/bin/env python3
"""Plot alive count over time from a Game of Life CSV export.

The frontend's "Download stats" button writes a CSV with columns
`time_seconds,alive,generation`. This script renders alive vs. time as a
PNG next to the input file (and shows it in a window if a display is
available).

Usage:
    python tools/plot.py <csv-file>
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

import matplotlib.pyplot as plt


def load(path: Path) -> tuple[list[float], list[int], list[int]]:
    times: list[float] = []
    alive: list[int] = []
    gens: list[int] = []
    with path.open() as f:
        for row in csv.DictReader(f):
            times.append(float(row["time_seconds"]))
            alive.append(int(row["alive"]))
            gens.append(int(row["generation"]))
    return times, alive, gens


def plot(path: Path) -> Path:
    times, alive, gens = load(path)
    if not times:
        sys.exit(f"{path}: no samples")

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(times, alive, color="tab:blue", linewidth=1.5, label="alive")
    ax.set_xlabel("seconds")
    ax.set_ylabel("alive cells", color="tab:blue")
    ax.tick_params(axis="y", labelcolor="tab:blue")
    ax.grid(alpha=0.3)

    ax2 = ax.twinx()
    ax2.plot(times, gens, color="tab:gray", linewidth=1, linestyle="--", label="generation")
    ax2.set_ylabel("generation", color="tab:gray")
    ax2.tick_params(axis="y", labelcolor="tab:gray")

    ax.set_title(path.name)
    fig.tight_layout()

    out = path.with_suffix(".png")
    fig.savefig(out, dpi=120)
    return out


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: python tools/plot.py <csv-file>")
    path = Path(sys.argv[1])
    out = plot(path)
    print(f"wrote {out}")
    try:
        plt.show()
    except Exception:
        pass


if __name__ == "__main__":
    main()
