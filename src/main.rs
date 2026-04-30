use std::collections::HashSet;

fn main() {
    println!("Hello, world!");
    let mut cm = CellManager::new();
    cm.toggle_state((0,0));
}

struct CellManager {
    living_cells: HashSet<(i32, i32)>

}

impl CellManager {
    fn new() -> Self {
        CellManager {
            living_cells: HashSet::new()
        }
    }

    fn toggle_state(&mut self, (x, y): (i32, i32)) {
        if self.living_cells.contains(&(x, y)) {
            self.living_cells.remove(&(x, y));
        }
        else {
            self.living_cells.insert((x, y));
        }
    }

    // TODO
    fn tick() {

    }
}