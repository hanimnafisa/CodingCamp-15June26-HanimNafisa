/* =============================================
   MY DASHBOARD — app.js
   Vanilla JS | LocalStorage | No frameworks
   ============================================= */

'use strict';

/* ── Storage helpers ─────────────────────────── */
const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* =============================================
   THEME
   ============================================= */
(function initTheme() {
  const saved = storage.get('theme', 'light');
  applyTheme(saved);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      storage.set('theme', btn.dataset.theme);
    });
  });
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

/* =============================================
   GREETING — clock, date, time-of-day message
   ============================================= */
(function initGreeting() {
  const clockEl   = document.getElementById('clock');
  const dateEl    = document.getElementById('date-display');
  const greetEl   = document.getElementById('greeting-text');

  function tick() {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;

    const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Its Friday!','Saturday'];
    const months= ['January','February','March','April','May✨','June','July🦋','August','September','October','November','December'];
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const hr = now.getHours();
    if      (hr >= 5  && hr < 12) greetEl.textContent = '🌅 Good Morning Hanim!';
    else if (hr >= 12 && hr < 17) greetEl.textContent = '☀️ Good Afternoon Hanim!';
    else if (hr >= 17 && hr < 21) greetEl.textContent = '🌇 Good Evening Hanim!';
    else                          greetEl.textContent = '🌙 Good Night Hanim!';
  }

  tick();
  setInterval(tick, 1000);
})();

/* =============================================
   FOCUS TIMER
   ============================================= */
(function initTimer() {
  const displayEl  = document.getElementById('timer-display');
  const progressEl = document.getElementById('timer-progress-bar');
  const startBtn   = document.getElementById('timer-start');
  const stopBtn    = document.getElementById('timer-stop');
  const resetBtn   = document.getElementById('timer-reset');
  const durationIn = document.getElementById('timer-duration');

  let totalSeconds   = 25 * 60;
  let remainingSeconds = totalSeconds;
  let intervalId     = null;
  let running        = false;

  function getDurationMinutes() {
    const v = parseInt(durationIn.value, 10);
    return (isNaN(v) || v < 1) ? 25 : Math.min(v, 120);
  }

  function format(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateUI() {
    displayEl.textContent = format(remainingSeconds);
    const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
    progressEl.style.width = pct + '%';
  }

  function tick() {
    if (remainingSeconds <= 0) {
      clearInterval(intervalId);
      running = false;
      displayEl.textContent = '00:00';
      progressEl.style.width = '0%';
      // Brief notification
      if (document.title.startsWith('⏰')) return;
      const oldTitle = document.title;
      document.title = '⏰ Time\'s up! — ' + oldTitle.replace(/^⏰.*?— /, '');
      setTimeout(() => { document.title = oldTitle; }, 5000);
      return;
    }
    remainingSeconds--;
    updateUI();
  }

  startBtn.addEventListener('click', () => {
    if (running) return;
    // If at full, pick up current duration setting
    if (remainingSeconds === totalSeconds) {
      totalSeconds = getDurationMinutes() * 60;
      remainingSeconds = totalSeconds;
    }
    running = true;
    intervalId = setInterval(tick, 1000);
    updateUI();
  });

  stopBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    running = false;
    totalSeconds = getDurationMinutes() * 60;
    remainingSeconds = totalSeconds;
    updateUI();
  });

  durationIn.addEventListener('change', () => {
    if (!running) {
      totalSeconds = getDurationMinutes() * 60;
      remainingSeconds = totalSeconds;
      updateUI();
    }
  });

  updateUI();
})();

/* =============================================
   TO-DO LIST
   ============================================= */
(function initTodo() {
  const input    = document.getElementById('todo-input');
  const addBtn   = document.getElementById('todo-add-btn');
  const listEl   = document.getElementById('todo-list');
  const emptyEl  = document.getElementById('todo-empty');
  const sortBtns = document.querySelectorAll('.sort-btn');
  const modal    = document.getElementById('edit-modal');
  const editIn   = document.getElementById('edit-task-input');
  const saveBtn  = document.getElementById('edit-save-btn');
  const cancelBtn= document.getElementById('edit-cancel-btn');

  let tasks       = storage.get('tasks', []);
  let currentSort = storage.get('todoSort', 'default');
  let editingId   = null;
  let dragSrcIdx  = null;

  /* ── Sort helpers ── */
  function getSorted() {
    const copy = [...tasks];
    if (currentSort === 'az')   return copy.sort((a,b) => a.text.localeCompare(b.text));
    if (currentSort === 'za')   return copy.sort((a,b) => b.text.localeCompare(a.text));
    if (currentSort === 'done') return copy.sort((a,b) => Number(a.done) - Number(b.done));
    return copy; // default = creation order
  }

  function save() { storage.set('tasks', tasks); }

  /* ── Render ── */
  function render() {
    listEl.innerHTML = '';
    const sorted = getSorted();
    const isEmpty = sorted.length === 0;
    emptyEl.classList.toggle('visible', isEmpty);

    sorted.forEach((task, sortedIdx) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.done ? ' done' : '');
      li.draggable = true;
      li.dataset.id = task.id;

      li.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <input type="checkbox" class="todo-check" ${task.done ? 'checked' : ''}
               aria-label="Mark done" />
        <span class="todo-text">${escHtml(task.text)}</span>
        <div class="todo-actions">
          <button class="todo-btn edit"   title="Edit task">✏️</button>
          <button class="todo-btn delete" title="Delete task">🗑️</button>
        </div>`;

      // Check
      li.querySelector('.todo-check').addEventListener('change', () => {
        const t = tasks.find(t => t.id === task.id);
        if (t) { t.done = !t.done; save(); render(); }
      });
      // Edit
      li.querySelector('.todo-btn.edit').addEventListener('click', () => openEdit(task.id));
      // Delete
      li.querySelector('.todo-btn.delete').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        save(); render();
      });

      // Drag & drop (reorder in default sort only)
      li.addEventListener('dragstart', e => {
        dragSrcIdx = getRealIdx(task.id);
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', e => {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (currentSort !== 'default') return; // only reorder in default
        const destIdx = getRealIdx(task.id);
        if (dragSrcIdx === null || dragSrcIdx === destIdx) return;
        const moved = tasks.splice(dragSrcIdx, 1)[0];
        tasks.splice(destIdx, 0, moved);
        dragSrcIdx = null;
        save(); render();
      });

      listEl.appendChild(li);
    });

    // Highlight active sort
    sortBtns.forEach(b => b.classList.toggle('active', b.dataset.sort === currentSort));
  }

  function getRealIdx(id) { return tasks.findIndex(t => t.id === id); }

  /* ── Add task ── */
  function addTask() {
    const text = input.value.trim();
    if (!text) return;
    tasks.push({ id: Date.now().toString(), text, done: false });
    input.value = '';
    save(); render();
  }
  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  /* ── Sort buttons ── */
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      storage.set('todoSort', currentSort);
      render();
    });
  });

  /* ── Edit modal ── */
  function openEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    editIn.value = task.text;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    editIn.focus();
  }

  function closeEdit() {
    editingId = null;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  saveBtn.addEventListener('click', () => {
    const text = editIn.value.trim();
    if (!text || !editingId) return;
    const task = tasks.find(t => t.id === editingId);
    if (task) { task.text = text; save(); render(); }
    closeEdit();
  });

  cancelBtn.addEventListener('click', closeEdit);
  editIn.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); if (e.key === 'Escape') closeEdit(); });
  modal.addEventListener('click', e => { if (e.target === modal) closeEdit(); });

  render();
})();

/* =============================================
   QUICK LINKS
   ============================================= */
(function initLinks() {
  const gridEl   = document.getElementById('links-grid');
  const emptyEl  = document.getElementById('links-empty');
  const nameIn   = document.getElementById('link-name-input');
  const urlIn    = document.getElementById('link-url-input');
  const addBtn   = document.getElementById('link-add-btn');

  let links = storage.get('links', []);

  function save() { storage.set('links', links); }

  function getFavicon(url) {
    try {
      const origin = new URL(url).origin;
      return `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(origin)}`;
    } catch { return null; }
  }

  function render() {
    gridEl.innerHTML = '';
    const isEmpty = links.length === 0;
    emptyEl.classList.toggle('visible', isEmpty);

    links.forEach(link => {
      const wrap = document.createElement('div');
      wrap.className = 'link-btn-wrap';

      const a = document.createElement('a');
      a.className = 'link-btn';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const favicon = getFavicon(link.url);
      if (favicon) {
        const img = document.createElement('img');
        img.src = favicon;
        img.width = 16;
        img.height = 16;
        img.alt = '';
        img.onerror = () => img.remove();
        a.appendChild(img);
      }

      a.appendChild(document.createTextNode(link.name));

      const del = document.createElement('button');
      del.className = 'link-delete-btn';
      del.title = 'Remove link';
      del.textContent = '×';
      del.setAttribute('aria-label', `Remove ${link.name}`);
      del.addEventListener('click', () => {
        links = links.filter(l => l.id !== link.id);
        save(); render();
      });

      wrap.appendChild(a);
      wrap.appendChild(del);
      gridEl.appendChild(wrap);
    });
  }

  function addLink() {
    const name = nameIn.value.trim();
    let url = urlIn.value.trim();
    if (!name || !url) {
      if (!name) nameIn.focus();
      else urlIn.focus();
      return;
    }
    // Auto-prepend https:// if missing
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    links.push({ id: Date.now().toString(), name, url });
    nameIn.value = '';
    urlIn.value = '';
    save(); render();
    nameIn.focus();
  }

  addBtn.addEventListener('click', addLink);
  urlIn.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
  nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') urlIn.focus(); });

  render();
})();

/* ── XSS helper ── */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
