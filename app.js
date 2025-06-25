import { auth, db } from './firebase.js';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Kontrollera inloggning
window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
      loadTablesFromFirestore();
    } else {
      window.location.href = "login.html";
    }
  });
});

// Skapa ny tabell
window.createNewTable = async function () {
  const user = auth.currentUser;
  if (!user) {
    alert("Du är inte inloggad.");
    return;
  }

  const tableId = `taskTable_${Date.now()}`;

  await setDoc(doc(db, "users", user.uid, "tables", tableId), {
    title: "New Task Table",
    createdAt: new Date().toISOString()
  });

  renderTable(tableId, "New Task Table");

  // Vänta lite så att DOM hinner uppdateras
  setTimeout(() => {
    const newTable = document.getElementById(`${tableId}_container`);
    if (newTable) {
      newTable.classList.add("highlight");
      newTable.scrollIntoView({ behavior: "smooth", block: "start" });

      // Ta bort highlight efter några sekunder
      setTimeout(() => {
        newTable.classList.remove("highlight");
      }, 3000);
    }
  }, 100);
};


// Ladda tabeller
async function loadTablesFromFirestore() {
  const user = auth.currentUser;
  if (!user) return;

  const tablesRef = collection(db, "users", user.uid, "tables");
  const snapshot = await getDocs(tablesRef);

  snapshot.forEach(docSnap => {
    const tableId = docSnap.id;
    const data = docSnap.data();
    renderTable(tableId, data.title);
  });
}

// Visa tabell i gränssnittet
function renderTable(tableId, title) {
  const container = document.getElementById("tablesContainer");

  const tableHTML = `
    <div class="task-table" id="${tableId}_container">
      <div class="table-header">
        <h2 contenteditable="true" id="${tableId}_title">${title}</h2>
        <button class="collapse-btn" onclick="toggleCollapse('${tableId}')">🔼 Collapse</button>
        <button class="delete-table-btn" onclick="deleteTable('${tableId}')">🗑️ Delete Table</button>
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

  const titleElement = document.getElementById(`${tableId}_title`);
  titleElement.addEventListener("blur", async () => {
    const newTitle = titleElement.innerText.trim();
    if (!newTitle) return;

    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid, "tables", tableId), {
      title: newTitle
    }, { merge: true });
  });
}

// Radera tabell
window.deleteTable = async function (tableId) {
  const user = auth.currentUser;
  if (!user) return;

  const confirmDelete = confirm("Är du säker på att du vill radera tabellen?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "users", user.uid, "tables", tableId));
  const tableElement = document.getElementById(`${tableId}_container`);
  if (tableElement) tableElement.remove();
};


// Hämta alla tasks för en tabell
async function getTasks(tableId) {
  const user = auth.currentUser;
  if (!user) return [];

  const tasksRef = collection(db, "users", user.uid, "tables", tableId, "tasks");
  const snapshot = await getDocs(tasksRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Lägg till en ny task
window.addTask = async function (tableId) {
  const user = auth.currentUser;
  if (!user) return;

  const taskInput = document.getElementById(`${tableId}_task`);
  const descInput = document.getElementById(`${tableId}_desc`);
  const dueInput = document.getElementById(`${tableId}_due`);
  const priorityInput = document.getElementById(`${tableId}_priority`);

  const task = taskInput.value.trim();
  const description = descInput.value.trim();
  const dueDate = dueInput.value;
  const priority = priorityInput.value;

  if (!task) {
    alert("Uppgiftens namn krävs.");
    return;
  }

  const taskId = `task_${Date.now()}`;
  const order = Date.now(); // används för sortering
  try {

    await setDoc(doc(db, "users", user.uid, "tables", tableId, "tasks", taskId), {
      task,
      description,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      order
    });


    taskInput.value = "";
    descInput.value = "";
    dueInput.value = "";
    priorityInput.value = "Medium";

    renderTasks(tableId);
  } catch (error) {
    console.error("❌ Fel vid tillägg:", error.code, error.message);
    alert("Kunde inte spara uppgiften: " + error.message);
  }
};

// Visa alla tasks i tabellen
window.renderTasks = async function (tableId) {
  const list = document.getElementById(`${tableId}_list`);
  list.innerHTML = "";

  const tasks = await getTasks(tableId);
  tasks.sort((a, b) => a.order - b.order); // sortera efter order

  tasks.forEach((t) => {
    const row = document.createElement("tr");
    row.className = `task-row ${t.completed ? "completed" : ""}`;

    // Gör raden draggable och lägg till metadata
    row.setAttribute("draggable", "true");
    row.dataset.taskId = t.id;
    row.dataset.tableId = tableId;

    row.innerHTML = `
      <td>${t.task}</td>
      <td>${t.description}</td>
      <td>${t.dueDate ? t.dueDate.split("T")[0] : ""}<br><small>${t.dueDate?.split("T")[1] || ""}</small></td>
      <td>${t.priority}</td>
      <td>${t.completed ? "✅" : "❌"}</td>
      <td>
        <button onclick="toggleTask('${tableId}', '${t.id}', ${!t.completed})">
          ${t.completed ? "🔄 Reopen" : "✅ Complete"}
        </button>
        <button onclick="deleteTask('${tableId}', '${t.id}')">🗑️ Delete</button>
        <button onclick="startEditTask('${tableId}', '${t.id}')">✏️ Edit</button>
      </td>
    `;

    list.appendChild(row);
  });
  const dropRow = document.createElement("tr");
  dropRow.className = "always-drop-zone";
  dropRow.innerHTML = `<td colspan="6" style="text-align:center; color: #aaa;">🟦 Drop tasks here</td>`;
  list.appendChild(dropRow);
  enableDragAndDrop(tableId);
};


window.startEditTask = function (tableId, taskId) {
  const row = document.querySelector(`#${tableId}_list tr button[onclick*="'${taskId}'"]`).closest("tr");
  const cells = row.querySelectorAll("td");

  const task = cells[0].innerText;
  const description = cells[1].innerText;
  const dueDate = cells[2].innerText.split("\n")[0];
  const time = cells[2].innerText.split("\n")[1]?.trim() || "";
  const priority = cells[3].innerText;

  cells[0].innerHTML = `<input value="${task}" />`;
  cells[1].innerHTML = `<input value="${description}" />`;
  cells[2].innerHTML = `<input type="datetime-local" value="${dueDate}T${time}" />`;
  cells[3].innerHTML = `
    <select>
      <option value="Low" ${priority === "Low" ? "selected" : ""}>Low</option>
      <option value="Medium" ${priority === "Medium" ? "selected" : ""}>Medium</option>
      <option value="High" ${priority === "High" ? "selected" : ""}>High</option>
    </select>
  `;
  cells[5].innerHTML = `
    <button onclick="saveTaskEdit('${tableId}', '${taskId}')">💾 Save</button>
    <button onclick="renderTasks('${tableId}')">❌ Cancel</button>
  `;
};

window.saveTaskEdit = async function (tableId, taskId) {
  const user = auth.currentUser;
  if (!user) return;

  const row = document.querySelector(`#${tableId}_list tr button[onclick*="'${taskId}'"]`).closest("tr");
  const inputs = row.querySelectorAll("input, select");

  const task = inputs[0].value.trim();
  const description = inputs[1].value.trim();
  const dueDate = inputs[2].value;
  const priority = inputs[3].value;

  const taskRef = doc(db, "users", user.uid, "tables", tableId, "tasks", taskId);
  await updateDoc(taskRef, {
    task,
    description,
    dueDate,
    priority
  });

  renderTasks(tableId);
};



// Uppdatera status (complete/reopen)
window.toggleTask = async function (tableId, taskId, newStatus) {
  const user = auth.currentUser;
  if (!user) return;

  const taskRef = doc(db, "users", user.uid, "tables", tableId, "tasks", taskId);
  await updateDoc(taskRef, { completed: newStatus });
  renderTasks(tableId);
};

// Radera en task
window.deleteTask = async function (tableId, taskId) {
  const confirmDelete = confirm("Är du säker på att du vill ta bort uppgiften?");
  if (!confirmDelete) return;

  const user = auth.currentUser;
  if (!user) return;

  const taskRef = doc(db, "users", user.uid, "tables", tableId, "tasks", taskId);
  await deleteDoc(taskRef);
  renderTasks(tableId);
};

// Fäll ihop/expandera tabell
window.toggleCollapse = function (tableId) {
  const container = document.querySelector(`#${tableId}_container .task-list-container`);
  const button = document.querySelector(`#${tableId}_container .collapse-btn`);

  if (!container || !button) return;

  const isHidden = container.style.display === "none";
  container.style.display = isHidden ? "block" : "none";
  button.textContent = isHidden ? "🔼 Collapse" : "🔽 Expand";
};

//
function enableDragAndDrop(tableId) {
  const list = document.getElementById(`${tableId}_list`);
  const rows = list.querySelectorAll("tr");

  rows.forEach(row => {
    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
    });
  });

  // Lägg till drop-hantering på ALLA listor
  const allLists = document.querySelectorAll("tbody[id$='_list']");
  allLists.forEach(list => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
  });
}


function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll("tr:not(.dragging):not(.always-drop-zone)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}


async function updateTaskOrder(tableId) {
  const user = auth.currentUser;
  if (!user) return;

  const rows = document.querySelectorAll(`#${tableId}_list tr`);
  const updates = [];

  rows.forEach((row, index) => {
    const taskId = row.dataset.taskId;
    const taskRef = doc(db, "users", user.uid, "tables", tableId, "tasks", taskId);
    updates.push(updateDoc(taskRef, { order: index }));
  });

  await Promise.all(updates);
}



function handleDragOver(e) {
  e.preventDefault();
  const list = e.currentTarget;
  const after = getDragAfterElement(list, e.clientY);
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;

  if (after == null) {
    list.appendChild(dragging);
  } else {
    list.insertBefore(dragging, after);
  }
}

async function handleDrop(e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;

  const fromTableId = dragging.dataset.tableId;
  const taskId = dragging.dataset.taskId;
  const toTableId = e.currentTarget.id.replace("_list", "");

  const user = auth.currentUser;
  if (!user) return;

  const dropTarget = e.currentTarget;
  const rows = Array.from(dropTarget.querySelectorAll("tr:not(.always-drop-zone)"));

  let insertIndex = rows.findIndex(row => row === dragging);
  if (insertIndex === -1) {
    insertIndex = rows.length;
  }


  try {
    if (fromTableId !== toTableId) {
      // 1. Hämta uppgiftsdata
      const fromRef = doc(db, "users", user.uid, "tables", fromTableId, "tasks", taskId);
      const taskSnap = await getDoc(fromRef);
      if (!taskSnap.exists()) throw new Error("Uppgiften finns inte.");

      const taskData = taskSnap.data();

      // 2. Ta bort från gamla tabellen
      await deleteDoc(fromRef);

      // 3. Lägg till i nya tabellen
      const toRef = doc(db, "users", user.uid, "tables", toTableId, "tasks", taskId);
      await setDoc(toRef, { ...taskData, order: insertIndex });


      try {
        dragging.dataset.tableId = toTableId;
      } catch (e) {
        console.error("❌ Fel vid uppdatering av dataset.tableId:", e.message);
      }

      try {
        await updateTaskOrder(toTableId);
      } catch (e) {
        console.error("❌ Fel vid updateTaskOrder:", e.message);
      }

      try {
        await renderTasks(fromTableId);
        await renderTasks(toTableId);
      } catch (e) {
        console.error("❌ Fel vid renderTasks:", e.message);
      }


      console.log(`✅ Uppgift flyttad från ${fromTableId} till ${toTableId}`);
    } else {
      // Flytt inom samma tabell
      await updateTaskOrder(toTableId);
      await renderTasks(toTableId);
    }
  } catch (error) {
    console.error("❌ Fel vid flytt:", error.message);
  }
}






