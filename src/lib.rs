use std::cmp::max;
use std::collections::{HashMap, HashSet};
use rand::RngExt;
use wasm_bindgen::prelude::*;

static DIRS: [(i32, i32); 8] = [
    (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1),
];

// Neat
#[derive(Default)]
struct Modifiers {
    random_spawn: bool,
}

#[wasm_bindgen]
pub struct CellManager {
    living_cells: HashSet<(i32, i32)>,
    modifiers: Modifiers,
}

#[wasm_bindgen]
impl CellManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            living_cells: HashSet::new(),
            modifiers: Modifiers::default(),
        }
    }

    pub fn toggle(&mut self, x: i32, y: i32) {
        if !self.living_cells.insert((x, y)) {
            self.living_cells.remove(&(x, y));
        }
    }

    pub fn count(&self) -> usize {
        self.living_cells.len()
    }

    pub fn clear(&mut self) {
        self.living_cells.clear();
    }

    pub fn set_random_spawn(&mut self, on: bool) {
        self.modifiers.random_spawn = on;
    }

    pub fn tick(&mut self) {
        let mut counts: HashMap<(i32, i32), i32> = HashMap::new();
        for &(x, y) in &self.living_cells {
            counts.entry((x, y)).or_insert(0);
            for (dx, dy) in DIRS {
                *counts.entry((x + dx, y + dy)).or_insert(0) += 1;
            }
        }

        let spawn_prob = if self.modifiers.random_spawn {
            1.0_f64 / max(1, self.living_cells.len()) as f64
        } else {
            0.0
        };
        let mut rng = rand::rng();

        let mut next = HashSet::with_capacity(self.living_cells.len());
        for (cell, n) in counts {
            let alive = self.living_cells.contains(&cell);
            let conway = (alive && (n == 2 || n == 3)) || (!alive && n == 3);
            let spark = spawn_prob > 0.0 && rng.random_bool(spawn_prob);
            if conway || spark {
                next.insert(cell);
            }
        }
        self.living_cells = next;
    }

    pub fn living_in_view(&self, min_x: i32, min_y: i32, max_x: i32, max_y: i32) -> Vec<i32> {
        let mut out = Vec::new();
        for &(x, y) in &self.living_cells {
            if x >= min_x && x < max_x && y >= min_y && y < max_y {
                out.push(x);
                out.push(y);
            }
        }
        out
    }
}
