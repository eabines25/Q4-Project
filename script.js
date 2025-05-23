document.addEventListener("DOMContentLoaded", () => {
  const grid             = document.getElementById("grid");
  const colorPicker      = document.getElementById("colorPicker");
  const toolSelect       = document.getElementById("toolSelect");
  const brushSizeInput   = document.getElementById("brushSizeInput");
  const clearBtn         = document.getElementById("clearBtn");
  const resizeBtn        = document.getElementById("resizeBtn");
  const gridSizeInput    = document.getElementById("gridSizeInput");
  const toggleGridBtn    = document.getElementById("toggleGridBtn");
  const saveBtn          = document.getElementById("saveBtn");
  const undoBtn          = document.getElementById("undoBtn");
  const redoBtn          = document.getElementById("redoBtn");
  const projectNameInput = document.getElementById("projectNameInput");
  const saveProjectBtn   = document.getElementById("saveNewProjectBtn");
  const goToProjectsBtn  = document.getElementById("goToProjectsBtn");

  let currentGridSize  = parseInt(gridSizeInput.value, 10) || 32;
  let gridLinesVisible = true;
  let editingProject   = null;

  const undoStack    = [];
  const redoStack    = [];
  const maxStackSize = 50;
  const STORAGE_KEY  = "pixelArtProjects";

  // Load/save multiple projects
  function getProjects() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }
  function setProjects(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // Undo/redo helpers
  function saveState() {
    const state = Array.from(grid.children).map(c => c.style.backgroundColor);
    undoStack.push(state);
    if (undoStack.length > maxStackSize) undoStack.shift();
    redoStack.length = 0;
  }
  function restoreState(state) {
    grid.querySelectorAll(".cell")
        .forEach((c,i) => c.style.backgroundColor = state[i]);
  }
  function undo() {
    if (!undoStack.length) return;
    const current = Array.from(grid.children).map(c => c.style.backgroundColor);
    redoStack.push(current);
    restoreState(undoStack.pop());
  }
  function redo() {
    if (!redoStack.length) return;
    const current = Array.from(grid.children).map(c => c.style.backgroundColor);
    undoStack.push(current);
    restoreState(redoStack.pop());
  }

  // Build the grid
  function createGrid(size) {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${size},20px)`;
    grid.style.gridTemplateRows    = `repeat(${size},20px)`;
    for (let i = 0; i < size*size; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (!gridLinesVisible) cell.style.border = "none";
      cell.addEventListener("mousedown", e => {
        e.preventDefault();
        saveState();
        paint(cell);
      });
      cell.addEventListener("mouseover", e => {
        if (e.buttons === 1) paint(cell);
      });
      grid.appendChild(cell);
    }
  }

  // Paint according to tool
  function paint(cell) {
    const tool  = toolSelect.value;
    const size  = parseInt(brushSizeInput.value,10) || 1;
    const color = colorPicker.value;
    if (tool === "brush")      stampSquare(cell, color, size);
    else if (tool === "eraser")stampSquare(cell, "#fff", size);
    else if (tool === "fill")   floodFill(cell, color);
  }

  // Square stamp for brush/eraser
  function stampSquare(cell, color, size) {
    const cells = Array.from(grid.children),
          idx   = cells.indexOf(cell),
          row   = Math.floor(idx/currentGridSize),
          col   = idx % currentGridSize,
          half  = Math.floor(size/2);
    for (let dy=-half; dy<=half; dy++) {
      for (let dx=-half; dx<=half; dx++) {
        const r = row+dy, c = col+dx;
        if (r>=0 && r<currentGridSize && c>=0 && c<currentGridSize) {
          cells[r*currentGridSize + c].style.backgroundColor = color;
        }
      }
    }
  }

  // Flood fill (bucket)
  function floodFill(start, newColor) {
    const orig = start.style.backgroundColor;
    if (orig === newColor) return;
    const cells = Array.from(grid.children),
          queue = [cells.indexOf(start)];
    while (queue.length) {
      const i = queue.shift(), cell = cells[i];
      if (cell.style.backgroundColor !== orig) continue;
      cell.style.backgroundColor = newColor;
      const row = Math.floor(i/currentGridSize),
            col = i % currentGridSize;
      [[row,col-1],[row,col+1],[row-1,col],[row+1,col]]
        .forEach(([r,c]) => {
          if (r>=0 && r<currentGridSize && c>=0 && c<currentGridSize) {
            const ni = r*currentGridSize + c;
            if (cells[ni].style.backgroundColor === orig) queue.push(ni);
          }
        });
    }
  }

  // Button events
  clearBtn.addEventListener("click", () => {
    saveState();
    grid.querySelectorAll(".cell").forEach(c => c.style.backgroundColor = "#fff");
  });
  resizeBtn.addEventListener("click", () => {
    const s = parseInt(gridSizeInput.value,10);
    if (s>=5 && s<=64) {
      currentGridSize = s;
      createGrid(s);
    }
  });
  toggleGridBtn.addEventListener("click", () => {
    gridLinesVisible = !gridLinesVisible;
    grid.querySelectorAll(".cell").forEach(c => {
      c.style.border = gridLinesVisible ? null : "none";
    });
  });
  saveBtn.addEventListener("click", () => {
    const cs = 20, canvas = document.createElement("canvas");
    canvas.width  = currentGridSize * cs;
    canvas.height = currentGridSize * cs;
    const ctx = canvas.getContext("2d");
    grid.querySelectorAll(".cell").forEach((c,i) => {
      ctx.fillStyle = c.style.backgroundColor || "#fff";
      const r = Math.floor(i/currentGridSize),
            col = i % currentGridSize;
      ctx.fillRect(col*cs, r*cs, cs, cs);
    });
    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = canvas.toDataURL();
    link.click();
  });
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
  });

  // Save or update project
  saveProjectBtn.addEventListener("click", () => {
    const nameInput = projectNameInput.value.trim();
    const projects  = getProjects();

    if (editingProject) {
      const idx = projects.findIndex(p => p.name === editingProject);
      if (idx !== -1) {
        projects[idx] = {
          name: editingProject,
          size: currentGridSize,
          cells: Array.from(grid.children).map(c => c.style.backgroundColor)
        };
        setProjects(projects);
        alert(`Project "${editingProject}" updated.`);
      }
    } else {
      if (!nameInput) return alert("Enter a project name.");
      if (projects.some(p => p.name === nameInput)) {
        return alert("That name’s already taken.");
      }
      projects.push({
        name: nameInput,
        size: currentGridSize,
        cells: Array.from(grid.children).map(c => c.style.backgroundColor)
      });
      setProjects(projects);
      alert(`Project "${nameInput}" saved.`);
    }
  });

  goToProjectsBtn.addEventListener("click", () => {
    window.location.href = "projects.html";
  });

  // Load existing project if any
  const toLoad = localStorage.getItem("currentProjectName");
  if (toLoad) {
    const p = getProjects().find(x => x.name === toLoad);
    if (p) {
      editingProject = toLoad;
      projectNameInput.value = toLoad;
      projectNameInput.disabled = true;
      currentGridSize = p.size;
      gridSizeInput.value = p.size;
      createGrid(p.size);
      p.cells.forEach((col,i) => {
        grid.children[i].style.backgroundColor = col;
      });
    }
    localStorage.removeItem("currentProjectName");
  } else {
    createGrid(currentGridSize);
  }
});
