let tableCount = 0;

function createNewTable() {
  const container = document.getElementById("tablesContainer");
  const tableId = `taskTable_${tableCount++}`;

  const tableHTML = `
    <div class="task-table" id="${tableId}_container">
      <div class="table-header">
        <h2 contenteditable="true">${getTableTitle(tableId) || "New Task Table"}</h2>
        <button class="collapse-btn" onclick="toggleCollapse('${tableId}')">Collapse</button>
      </div>
      <div class="input-section">
        <input type="text" placeholder="Task" id="${tableId}_task" />
        <input type="text" placeholder="Description" id="${tableId}_desc" />
        <input type="datetime-local" id="${tableId}_due" />
        <select id="${tableId}_priority">
          <option value="Low">Low</option>
          <option value="Medium" selected>Medium</option>
          <option value="High">High</option>
        </select>
        <button onclick="addTask('${tableId}')">Add Task</button>
      </div>
      <div class="task-list-container">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="${tableId}_list"></tbody>
        </table>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", tableHTML);
  saveTableId(tableId);
  renderTasks(tableId);

  const titleElement = document.querySelector(`#${tableId}_container h2`);
  titleElement.addEventListener("input", () => {
    saveTableTitle(tableId, titleElement.innerText);
  });
}

function saveTableId(tableId) {
  const tableIds = JSON.parse(localStorage.getItem("tableIds")) || [];
  if (!tableIds.includes(tableId)) {
    tableIds.push(tableId);
    localStorage.setItem("tableIds", JSON.stringify(tableIds));
  }
}

function saveTableTitle(tableId, title) {
  const titles = JSON.parse(localStorage.getItem("tableTitles")) || {};
  titles[tableId] = title;
  localStorage.setItem("tableTitles", JSON.stringify(titles));
}

function getTableTitle(tableId) {
  const titles = JSON.parse(localStorage.getItem("tableTitles")) || {};
  return titles[tableId] || "";
}

function getTasks(tableId) {
  return JSON.parse(localStorage.getItem(tableId)) || [];
}

function saveTasks(tableId, tasks) {
  localStorage.setItem(tableId, JSON.stringify(tasks));
}

function addTask(tableId) {
  const task = document.getElementById(`${tableId}_task`).value.trim();
  const desc = document.getElementById(`${tableId}_desc`).value.trim();
  const due = document.getElementById(`${tableId}_due`).value;
  const priority = document.getElementById(`${tableId}_priority`).value;

  if (!task) return;

  const tasks = getTasks(tableId);
  tasks.push({ task, desc, due, priority, completed: false });
  saveTasks(tableId, tasks);
  renderTasks(tableId);

  document.getElementById(`${tableId}_task`).value = "";
  document.getElementById(`${tableId}_desc`).value = "";
  document.getElementById(`${tableId}_due`).value = "";
  document.getElementById(`${tableId}_priority`).value = "Medium";
}

function renderTasks(tableId) {
  const list = document.getElementById(`${tableId}_list`);
  list.innerHTML = "";

  const tasks = getTasks(tableId);

  tasks.forEach((t, index) => {
    const row = document.createElement("tr");
    row.className = t.completed ? "completed" : "";
    row.setAttribute("draggable", "true");
    row.setAttribute("data-index", index);

    row.innerHTML = `
         <td>${t.task}</td>
         <td>${t.desc}</td>
         <td>${t.due ? t.due.split("T")[0] : ""}
         <br>
            <small style="color: #555;">${t.due && t.due.includes("T") ? t.due.split("T")[1] : ""}</small>
         </td>

         <td>${t.priority}</td>
         <td>${t.completed ? "✅" : "❌"}</td>
         <td>
    <button class="complete" onclick="toggleTask('${tableId}', ${index})">
      ${t.completed ? "Reopen" : "Complete"}
    </button>
    <button class="delete" onclick="deleteTask('${tableId}', ${index})">Delete</button>
  </td>
`;

    list.appendChild(row);
  });

  enableDragAndDrop(tableId);
}

function toggleTask(tableId, index) {
  const tasks = getTasks(tableId);
  tasks[index].completed = !tasks[index].completed;
  saveTasks(tableId, tasks);
  renderTasks(tableId);
}

function deleteTask(tableId, index) {
  const tasks = getTasks(tableId);
  tasks.splice(index, 1);
  saveTasks(tableId, tasks);
  renderTasks(tableId);
}

function enableDragAndDrop(tableId) {
  const rows = document.querySelectorAll(`#${tableId}_list tr`);

  rows.forEach(row => {
    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      updateOrder(tableId);
    });
  });

  const list = document.getElementById(`${tableId}_list`);
  list.addEventListener("dragover", e => {
    e.preventDefault();
    const after = getDragAfterElement(list, e.clientY);
    const dragging = document.querySelector(".dragging");
    if (after == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, after);
    }
  });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll("tr:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateOrder(tableId) {
  const newTasks = [];
  const rows = document.querySelectorAll(`#${tableId}_list tr`);
  const oldTasks = getTasks(tableId);

  rows.forEach(row => {
    const index = row.getAttribute("data-index");
    newTasks.push(oldTasks[index]);
  });

  saveTasks(tableId, newTasks);
  renderTasks(tableId);
}

function toggleCollapse(tableId) {
  const container = document.getElementById(`${tableId}_container`);
  const listContainer = container.querySelector(".task-list-container");
  const inputSection = container.querySelector(".input-section");
  const btn = container.querySelector(".collapse-btn");

  const isHidden = listContainer.style.display === "none";

  listContainer.style.display = isHidden ? "block" : "none";
  inputSection.style.display = isHidden ? "block" : "none";
  btn.textContent = isHidden ? "Collapse" : "Expand";
}

function recreateTable(tableId) {
  const container = document.getElementById("tablesContainer");

  const tableHTML = `
    <div class="task-table" id="${tableId}_container">
      <div class="table-header">
        <h2 contenteditable="true">${getTableTitle(tableId) || "Restored Task Table"}</h2>
        <button class="collapse-btn" onclick="toggleCollapse('${tableId}')">Collapse</button>
      </div>
      <div class="input-section">
        <input type="text" placeholder="Task" id="${tableId}_task" />
        <input type="text" placeholder="Description" id="${tableId}_desc" />
        <input type="datetime-local" id="${tableId}_due" />
        <select id="${tableId}_priority">
          <option value="Low">Low</option>
          <option value="Medium" selected>Medium</option>
          <option value="High">High</option>
        </select>
        <button onclick="addTask('${tableId}')">Add Task</button>
      </div>
      <div class="task-list-container">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="${tableId}_list"></tbody>
        </table>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", tableHTML);
  renderTasks(tableId);

  const titleElement = document.querySelector(`#${tableId}_container h2`);
  titleElement.addEventListener("input", () => {
    saveTableTitle(tableId, titleElement.innerText);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const tableIds = JSON.parse(localStorage.getItem("tableIds")) || [];
  tableCount = tableIds.length;
  tableIds.forEach(tableId => {
    recreateTable(tableId);
  });
});
