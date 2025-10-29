// --- GESTOR DE TAREAS ---
// Archivo donde se guardarán las tareas
const FILE_NAME = "todo_list.json";

// Función para cargar tareas desde el almacenamiento local
function loadTasks() {
  const fm = FileManager.iCloud();
  const filePath = fm.joinPath(fm.documentsDirectory(), FILE_NAME);
  if (fm.fileExists(filePath)) {
    return JSON.parse(fm.readString(filePath));
  }
  return [];
}

// Función para guardar tareas en el almacenamiento local
function saveTasks(tasks) {
  const fm = FileManager.iCloud();
  const filePath = fm.joinPath(fm.documentsDirectory(), FILE_NAME);
  fm.writeString(filePath, JSON.stringify(tasks));
}

// Función para convertir texto a tachado (Unicode)
function strikethrough(text) {
  return text
    .split("")
    .map(char => char + "\u0336")
    .join("");
}

// Mostrar menú principal
async function showMenu() {
  const menu = new Alert();
  menu.title = "📋 Lista de tareas";
  menu.message = "Selecciona una acción:";
  menu.addAction("➕ Agregar tarea");
  menu.addAction("👀 Ver lista");
  menu.addAction("✅ Marcar como completada");
  menu.addAction("🗑️ Borrar tarea");
  menu.addCancelAction("Cancelar");

  const response = await menu.present();
  switch (response) {
    case 0:
      await addTask();
      break;
    case 1:
      await viewTasks();
      break;
    case 2:
      await markTaskAsCompleted();
      break;
    case 3:
      await deleteTask();
      break;
    default:
      console.log("Acción cancelada.");
  }
}

// Agregar una nueva tarea
async function addTask() {
  const alert = new Alert();
  alert.title = "Agregar tarea";
  alert.message = "Escribe una nueva tarea para tu lista:";
  alert.addTextField("Nueva tarea");
  alert.addAction("Guardar");
  alert.addCancelAction("Cancelar");

  const response = await alert.present();
  if (response === 0) {
    const tasks = loadTasks();
    const newTask = alert.textFieldValue(0).trim();
    if (newTask) {
      tasks.push({ title: newTask, completed: false });
      saveTasks(tasks);
      console.log("Tarea agregada:", newTask);
    } else {
      console.log("No se agregó ninguna tarea.");
    }
  }
  await showMenu();
}

// Ver todas las tareas
async function viewTasks() {
  const tasks = loadTasks();
  const alert = new Alert();
  alert.title = "📋 Todas las tareas";

  alert.message = tasks.length > 0
    ? tasks
        .map(task =>
          task.completed
            ? `✅ ${strikethrough(task.title)} (completada)`
            : `• ${task.title}`
        )
        .join("\n")
    : "No tienes tareas pendientes.";

  alert.addAction("Volver");
  await alert.present();
  await showMenu();
}

// Marcar tareas como completadas
async function markTaskAsCompleted() {
  const tasks = loadTasks();
  const pendingTasks = tasks.filter(task => !task.completed);

  if (pendingTasks.length === 0) {
    const alert = new Alert();
    alert.title = "No hay tareas pendientes";
    alert.message = "Todas las tareas ya están completadas.";
    alert.addAction("Volver");
    await alert.present();
    await showMenu();
    return;
  }

  const alert = new Alert();
  alert.title = "Marcar como completada";
  alert.message = "Selecciona una tarea para marcarla como completada:";

  pendingTasks.forEach(task => {
    alert.addAction(task.title);
  });
  alert.addCancelAction("Cancelar");

  const response = await alert.present();

  if (response >= 0 && response < pendingTasks.length) {
    const selectedTask = pendingTasks[response];
    selectedTask.completed = true;
    saveTasks(tasks);
    console.log("Tarea completada:", selectedTask.title);
  } else {
    console.log("No se seleccionó ninguna tarea o se canceló.");
  }
  await showMenu();
}

// Borrar una tarea
async function deleteTask() {
  const tasks = loadTasks();

  if (tasks.length === 0) {
    const alert = new Alert();
    alert.title = "No hay tareas";
    alert.message = "No tienes tareas para borrar.";
    alert.addAction("Volver");
    await alert.present();
    await showMenu();
    return;
  }

  const alert = new Alert();
  alert.title = "Borrar tarea";
  alert.message = "Selecciona una tarea para eliminarla:";

  tasks.forEach(task => {
    alert.addAction(task.title || "(Sin título)");
  });
  alert.addCancelAction("Cancelar");

  const response = await alert.present();

  if (response >= 0 && response < tasks.length) {
    const deletedTask = tasks.splice(response, 1);
    saveTasks(tasks);
    console.log("Tarea eliminada:", deletedTask[0].title || "(Sin título)");
  } else {
    console.log("No se eliminó ninguna tarea o se canceló.");
  }
  await showMenu();
}

// --- WIDGET ESTILIZADO ---
// Crear el widget
let widget = new ListWidget();

// Fondo degradado
let gradient = new LinearGradient();
gradient.colors = [new Color("#4caf50"), new Color("#087f23")];
gradient.locations = [0, 1];
widget.backgroundGradient = gradient;

// Icono decorativo centrado
widget.addSpacer();
let icon = widget.addText("📋");
icon.font = Font.systemFont(150); // Tamaño grande
icon.textColor = Color.white();
icon.centerAlignText();
widget.addSpacer();

// Enlace para reabrir este script
widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;

// Configurar el widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await showMenu();
}

Script.complete();
