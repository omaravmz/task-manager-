const API_URL = "/api/tasks";

const add_button = document.getElementById("add-task-btn");
const task_list = document.getElementById("task-list");
const input = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date-input");
const priorityInput = document.getElementById("priority-input");

// MySQL DATE columns may come as "2026-05-01T00:00:00.000Z"
function normalizeDueDate(dateStr) {
    if (!dateStr) return "";
    return String(dateStr).split("T")[0];
}

function formatDisplayDate(dateStr) {
    const d = normalizeDueDate(dateStr);
    if (!d) return "No due date";
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
}

function priorityBadge(priority) {
    switch (priority) {
        case "low":  return `<span class="badge bg-success">Low</span>`;
        case "high": return `<span class="badge bg-danger">High</span>`;
        default:     return `<span class="badge bg-warning text-dark">Medium</span>`;
    }
}

function createTaskItem(task) {
    task.due_date = normalizeDueDate(task.due_date);

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center task-row";
    li._task = task;

    if (task.status === "completed") li.classList.add("completed");

    li.innerHTML = `
        <div class="task-info me-3">
            <div class="task-title fw-semibold">${task.title}</div>
            <small class="text-muted">
                Due: ${formatDisplayDate(task.due_date)} &nbsp; ${priorityBadge(task.priority)}
            </small>
        </div>
        <button class="btn btn-danger btn-sm delete-btn">&#x2715;</button>
    `;

    li.querySelector(".task-info").addEventListener("click", () => toggleComplete(li));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(li));

    return li;
}

async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const tasks = await res.json();
        task_list.innerHTML = "";
        tasks.forEach(task => task_list.appendChild(createTaskItem(task)));
    } catch (err) {
        console.error("Error fetching tasks:", err);
    }
}

async function addTask() {
    const title = input.value.trim();
    if (!title) return;

    const dueDate = dueDateInput.value;
    if (!dueDate) {
        dueDateInput.classList.add("is-invalid");
        return;
    }
    dueDateInput.classList.remove("is-invalid");

    const priority = priorityInput.value || "medium";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, due_date: dueDate, priority })
        });

        if (!res.ok) throw new Error("Failed to create task");

        input.value = "";
        dueDateInput.value = "";
        priorityInput.value = "medium";

        await fetchTasks();
    } catch (err) {
        console.error("Error adding task:", err);
    }
}

async function deleteTask(li) {
    const { id } = li._task;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        li.remove();
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

async function toggleComplete(li) {
    const task = li._task;
    const newStatus = task.status === "completed" ? "pending" : "completed";

    try {
        const res = await fetch(`${API_URL}/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: task.title,
                status: newStatus,
                priority: task.priority,
                due_date: task.due_date
            })
        });

        if (!res.ok) throw new Error("Failed to update task");

        task.status = newStatus;
        li.classList.toggle("completed", newStatus === "completed");
    } catch (err) {
        console.error("Error toggling task:", err);
    }
}

add_button.addEventListener("click", addTask);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

fetchTasks();
