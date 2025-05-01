document.addEventListener("DOMContentLoaded", function() {
  const grid = document.getElementById("grid");
  const colorPicker = document.getElementById("colorPicker");
  const toolSelect = document.getElementById("toolSelect");
  const clearBtn = document.getElementById("clearBtn");
  const resizeBtn = document.getElementById("resizeBtn");
  const gridSizeInput = document.getElementById("gridSizeInput");
  const toggleGridBtn = document.getElementById("toggleGridBtn");
  const saveBtn = document.getElementById("saveBtn");
  
  let currentGridSize = parseInt(gridSizeInput.value) || 16;
  let gridLinesVisible = true;
  
  // Create the grid based on current grid size
  function createGrid(size) {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${size}, 20px)`;
    grid.style.gridTemplateRows = `repeat(${size}, 20px)`;
    
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (!gridLinesVisible) {
        cell.style.border = "none";
      }
      
      // Paint or apply tool on cell mousedown
      cell.addEventListener("mousedown", function(e) {
        e.preventDefault();
        handleCellAction(cell);
      });
      
      // Paint or apply tool while dragging the mouse
      cell.addEventListener("mouseover", function(e) {
        if (e.buttons === 1) {
          handleCellAction(cell);
        }
      });
      
      grid.appendChild(cell);
    }
  }
  
  // Choose what happens when you interact with a cell based on the selected tool
  function handleCellAction(cell) {
    const tool = toolSelect.value;
    if (tool === "brush") {
      cell.style.backgroundColor = colorPicker.value;
    } else if (tool === "eraser") {
      cell.style.backgroundColor = "white";
    } else if (tool === "fill") {
      floodFill(cell, colorPicker.value);
    }
  }
  
  // A simple flood fill (bucket) tool to fill adjacent cells of the same color
  function floodFill(startCell, newColor) {
    const originalColor = startCell.style.backgroundColor;
    if (originalColor === newColor) return;
    
    const cells = Array.from(grid.children);
    const size = currentGridSize;
    
    function getCellIndex(cell) {
      return cells.indexOf(cell);
    }
    
    function getNeighbors(index) {
      const neighbors = [];
      const row = Math.floor(index / size);
      const col = index % size;
      if (col > 0) neighbors.push(index - 1);
      if (col < size - 1) neighbors.push(index + 1);
      if (row > 0) neighbors.push(index - size);
      if (row < size - 1) neighbors.push(index + size);
      return neighbors;
    }
    
    const queue = [getCellIndex(startCell)];
    while (queue.length > 0) {
      const index = queue.shift();
      const cell = cells[index];
      if (cell.style.backgroundColor === originalColor) {
        cell.style.backgroundColor = newColor;
        const neighbors = getNeighbors(index);
        neighbors.forEach(nIndex => {
          if (cells[nIndex].style.backgroundColor === originalColor) {
            queue.push(nIndex);
          }
        });
      }
    }
  }
  
  // Clear all cells to white
  clearBtn.addEventListener("click", function() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
      cell.style.backgroundColor = "white";
    });
  });
  
  // Resize the grid based on the input value
  resizeBtn.addEventListener("click", function() {
    const newSize = parseInt(gridSizeInput.value);
    if (newSize && newSize > 0) {
      currentGridSize = newSize;
      createGrid(currentGridSize);
    }
  });
  
  // Toggle the visibility of grid lines
  toggleGridBtn.addEventListener("click", function() {
    gridLinesVisible = !gridLinesVisible;
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
      cell.style.border = gridLinesVisible ? "1px solid #ddd" : "none";
    });
  });
  
  // Save the current pixel art as an image
  saveBtn.addEventListener("click", function() {
    const cellSize = 20;
    const canvas = document.createElement("canvas");
    canvas.width = currentGridSize * cellSize;
    canvas.height = currentGridSize * cellSize;
    const ctx = canvas.getContext("2d");
    const cells = Array.from(grid.children);
    
    cells.forEach((cell, i) => {
      const row = Math.floor(i / currentGridSize);
      const col = i % currentGridSize;
      // Use white as default if no color is set
      const color = cell.style.backgroundColor || "white";
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    });
    
    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = canvas.toDataURL();
    link.click();
  });
  
  // Create the initial grid
  createGrid(currentGridSize);
});
