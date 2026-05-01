# Conway's Game of Life

Simple project to get less Rust-rusty.
## Rules

A live cell with 2 or 3 living neighbours survives, a dead
cell with exactly 3 living neighbours is born, otherwise dead.

## Install

Prerequisites: Rust, Python3 for webserver

One-time setup:

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

## Run

Build the wasm bundle:

```sh
./build.sh
```

This produces `web/pkg/`. Then serve the `web/` directory:

```sh
python3 -m http.server -d web 8000
```

Open <http://localhost:8000>.

After editing `src/lib.rs`, re-run `./build.sh` and hard-reload the browser
(Cmd+Shift+R) to bust the wasm cache.


## Controls

- **Click** a cell to toggle it
- **Click and drag** to pan the infinite grid
- **Start / Stop** runs `tick()` on a timer; **Step** advances one generation
- **Speed** slider sets ticks per second
- Keyboard: `space` play/pause, `n` step, `c` clear

## Stats / instrumentation

While the simulation is running, the frontend samples the alive-cell count
once per wall-clock second and tags each sample with the generation number.
Click **Download stats** in the toolbar to export `gol-stats-*.csv` with
columns `time_seconds,alive,generation`. **Reset stats** clears the buffer.

To plot it (requires `pip install matplotlib`):

```sh
python3 tools/plot.py path/to/gol-stats-....csv
```

Writes a PNG next to the CSV and opens an interactive window if a display
is available.
