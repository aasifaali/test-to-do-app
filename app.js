const STORAGE_KEY = "todos";

const form = document.getElementById("new-todo-form");
const input = document.getElementById("new-todo-input");
const list = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const footer = document.getElementById("footer");
const count = document.getElementById("count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = loadTodos();
let currentFilter = "all";

// ---------- Storage ----------

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage may be unavailable (e.g. private mode); the app still works for this session.
  }
}

// ---------- Actions ----------

function addTodo(text) {
  todos.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    text,
    done: false,
    createdAt: Date.now(),
  });
  update();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
  update();
}

function editTodo(id, text) {
  if (!text) {
    deleteTodo(id);
    return;
  }
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.text = text;
  update();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  update();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.done);
  update();
}

function update() {
  saveTodos();
  render();
}

// ---------- Rendering ----------

function visibleTodos() {
  if (currentFilter === "active") return todos.filter((t) => !t.done);
  if (currentFilter === "completed") return todos.filter((t) => t.done);
  return todos;
}

function render() {
  list.innerHTML = "";

  for (const todo of visibleTodos()) {
    list.appendChild(createTodoElement(todo));
  }

  const remaining = todos.filter((t) => !t.done).length;
  count.textContent = `${remaining} ${remaining === 1 ? "item" : "items"} left`;

  emptyState.hidden = visibleTodos().length > 0;
  footer.hidden = todos.length === 0;
  clearCompletedBtn.hidden = !todos.some((t) => t.done);

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.setAttribute("aria-label", "Mark as done");
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  // textContent (not innerHTML) so user input is never treated as HTML
  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;
  text.addEventListener("dblclick", () => startEditing(li, text, todo));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", "Delete task");
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

  li.append(checkbox, text, deleteBtn);
  return li;
}

function startEditing(li, textEl, todo) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = todo.text;
  editInput.maxLength = 200;

  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    if (save) editTodo(todo.id, editInput.value.trim());
    else render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  editInput.addEventListener("blur", () => finish(true));

  li.replaceChild(editInput, textEl);
  editInput.focus();
  editInput.select();
}

// ---------- Events ----------

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearCompletedBtn.addEventListener("click", clearCompleted);

render();
