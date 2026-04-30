use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

static DIRS: [(i32, i32); 8] = [
    (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1),
];

#[wasm_bindgen]
pub struct CellManager {
    living_cells: HashSet<(i32, i32)>,
}

#[wasm_bindgen]
impl CellManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        CellManager { living_cells: HashSet::new() }
    }

    pub fn toggle(&mut self, x: i32, y: i32) {
        if !self.living_cells.insert((x, y)) {
            self.living_cells.remove(&(x, y));
        }
    }

    pub fn is_alive(&self, x: i32, y: i32) -> bool {
        self.living_cells.contains(&(x, y))
    }

    pub fn count(&self) -> usize {
        self.living_cells.len()
    }

    pub fn clear(&mut self) {
        self.living_cells.clear();
    }

    pub fn tick(&mut self) {
        let mut counts: HashMap<(i32, i32), i32> = HashMap::new();
        for &(x, y) in &self.living_cells {
            counts.entry((x, y)).or_insert(0);
            for (dx, dy) in DIRS {
                *counts.entry((x + dx, y + dy)).or_insert(0) += 1;
            }
        }
        let mut next = HashSet::with_capacity(self.living_cells.len());
        for (cell, n) in counts {
            let alive = self.living_cells.contains(&cell);
            if (alive && (n == 2 || n == 3)) || (!alive && n == 3) {
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

impl Default for CellManager {
    fn default() -> Self {
        Self::new()
    }
}
