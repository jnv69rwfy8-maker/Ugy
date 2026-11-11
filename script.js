/* The Logic Matrix v3.0 — Full Featured */
(function () {
  'use strict';

  const STORAGE_KEY = 'matrixStudioPro_v6';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ---------- State ----------
  let state = {
    level: 1, solved: 0, unlocked: false, storyProgress: 15,
    notes: '', workspaceBlocks: [], codeEditor: '', codeLang: 'javascript', promptText: '', pyCode: '',
    theme: 'dark', fontSize: 18, animations: true, watermark: true, autosave: true,
    nodePositions: {}, zoom: 1, pan: { x: 0, y: 0 },
    terminalHistory: [], historyIndex: -1, projects: [], activeProject: null, activeFile: null, configurations: {workspace:'MATRIX WORKSPACE',python:'3.12',js:'ES2023',runtime:'offline',timeout:3000,env:[]},
  };

  let dragNode = null, isPanning = false, panStart = { x: 0, y: 0 };
  let pyVars = {};

  // ---------- Storage ----------
  function save() {
    if (!state.autosave) return;
    try {
      const data = {
        level: state.level, solved: state.solved, unlocked: state.unlocked,
        storyProgress: state.storyProgress, notes: state.notes,
        workspaceBlocks: state.workspaceBlocks, codeEditor: state.codeEditor, codeLang: state.codeLang, pyCode: state.pyCode,
        promptText: state.promptText, theme: state.theme, fontSize: state.fontSize,
        animations: state.animations, watermark: state.watermark, autosave: state.autosave,
        nodePositions: state.nodePositions, zoom: state.zoom, pan: state.pan,
        terminalHistory: state.terminalHistory, pyVars: pyVars, projects: state.projects, activeProject: state.activeProject, activeFile: state.activeFile, configurations: state.configurations,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const el = $('#last-save-time');
      if (el) el.textContent = new Date().toLocaleTimeString('ar-EG');
      const ind = $('#save-indicator');
      if (ind) { ind.textContent = '● محفوظ'; ind.style.color = 'var(--green)'; }
    } catch (e) { console.warn('Save failed', e); }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('matrixStudioPro_v5');
      if (!raw) return;
      const data = JSON.parse(raw); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid backup');
      Object.assign(state, {
        level: data.level ?? 1, solved: data.solved ?? 0, unlocked: data.unlocked ?? false,
        storyProgress: data.storyProgress ?? 15, notes: data.notes ?? '',
        workspaceBlocks: data.workspaceBlocks ?? [], codeEditor: data.codeEditor ?? '', codeLang: data.codeLang ?? 'javascript', pyCode: data.pyCode ?? '',
        promptText: data.promptText ?? '', theme: data.theme ?? 'dark',
        fontSize: data.fontSize ?? 18, animations: data.animations ?? true,
        watermark: data.watermark ?? true, autosave: data.autosave ?? true,
        nodePositions: data.nodePositions ?? {}, zoom: data.zoom ?? 1, pan: data.pan ?? {x:0,y:0},
        terminalHistory: data.terminalHistory ?? [], projects: data.projects ?? [], activeProject: data.activeProject ?? null, activeFile: data.activeFile ?? null, configurations: data.configurations ?? state.configurations,
      });
      pyVars = data.pyVars ?? {};
      if (data.savedAt) {
        const el = $('#last-save-time');
        if (el) el.textContent = new Date(data.savedAt).toLocaleString('ar-EG');
      }
    } catch (e) { console.warn('Load failed', e); }
  }

  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }
  const debouncedSave = debounce(save, 600);

  // ---------- Theme ----------
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.style.fontSize = state.fontSize + 'px';
    document.body.classList.toggle('reduce-motion', !state.animations);
    const wm = $('.watermark');
    if (wm) wm.classList.toggle('hidden', !state.watermark);
    $$('[data-theme-set]').forEach((b) => b.classList.toggle('active', b.dataset.themeSet === state.theme));
    $$('[data-fontsize]').forEach((b) => b.classList.toggle('active', +b.dataset.fontsize === state.fontSize));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.theme === 'dark' ? '#1a110a' : '#ebe4d8';
  }

  // ---------- Toast ----------
  function showToast(msg, type = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show ' + type;
    setTimeout(() => el.classList.remove('show'), 2500);
  }

  // ---------- Status UI ----------
  function updateStatusUI() {
    $('#current-level').textContent = state.level + ' / 3';
    $('#solved-count').textContent = state.solved;
    const access = $('#access-status');
    const dot = $('#status-dot');
    const sys = $('#system-status');
    if (state.unlocked) {
      access.textContent = 'مفتوح'; access.className = 'value unlocked';
      dot.classList.add('unlocked'); sys.textContent = 'SYSTEM UNLOCKED';
      const badge = $('#console-badge'); if (badge) { badge.textContent = 'OPEN'; badge.style.background = 'var(--green-soft)'; badge.style.color = 'var(--green)'; }
    } else {
      access.textContent = 'مقفل'; access.className = 'value locked';
      dot.classList.remove('unlocked'); sys.textContent = 'SYSTEM LOCKED';
    }
    $('#story-progress').style.width = state.storyProgress + '%';
    const hints = [
      'استخدم الخريطة الذهنية ثم مختبر المنطق لفك الشفرات.',
      'النص معكوس — جرب بلوك العكس ثم Uppercase.',
      'المرحلة الأخيرة: جرب abogallab أو 4-2-2-2',
    ];
    $('#current-hint').textContent = hints[Math.min(state.level - 1, 2)];
  }

  // ---------- Navigation ----------
  function switchPanel(name) {
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
    $$('.panel').forEach((p) => {
      p.classList.remove('active');
      if (!state.animations) p.classList.add('no-anim');
      else p.classList.remove('no-anim');
    });
    const panel = $('#panel-' + name);
    if (panel) {
      // force reflow for animation restart
      void panel.offsetWidth;
      panel.classList.add('active');
    }
    if (name === 'mindmap') setTimeout(renderMindmap, 40);
    if (name === 'python') ensurePythonRuntime().catch(() => {});
    if (name === 'projects') renderProjects();
    if (name === 'shortcuts') renderShortcuts();
    if (name === 'config') renderConfigurations();
  }

  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // ---------- Terminal ----------
  const terminalOutput = $('#terminal-output');
  const terminalInput = $('#terminal-input');

  function printLine(text, type = '') {
    const line = document.createElement('div');
    line.className = 'line' + (type ? ' ' + type : '');
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
  function printStory(text) {
    const line = document.createElement('div');
    line.className = 'line story';
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function bootTerminal() {
    const intro = [
      { t: 'system', m: '═══════════════════════════════════' },
      { t: 'system', m: '  LOGIC MATRIX v3.0 — ONLINE' },
      { t: 'system', m: '═══════════════════════════════════' },
      { t: 'story', m: 'أنت داخل نظام قديم اسمه "The Logic Matrix". النظام مقفول، ومفيش حد قدر يفك شفرته بسهولة.' },
      { t: 'story', m: '"المفتاح مش في الكود... المفتاح في الطريقة اللي بتفكر بيها."' },
      { t: 'system', m: 'اكتب help للأوامر — أو ابدأ بالخريطة الذهنية.' },
    ];
    intro.forEach((item, i) => {
      setTimeout(() => item.t === 'story' ? printStory(item.m) : printLine(item.m, item.t), i * 150);
    });
  }

  const encrypted = {
    1: 'MSG-X7: ALPHA-9921-BETA-4480-GAMMA',
    2: 'kcatS eht ni deirrub si yek eht',
  };

  function processCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    printLine('root@matrix:~$ ' + cmd, 'prompt-echo');
    state.terminalHistory.push(cmd);
    debouncedSave();
    state.historyIndex = state.terminalHistory.length;
    const lower = cmd.toLowerCase();

    if (lower === 'abogallab' || lower === '4-2-2-2' || lower === '4222') {
      if (!state.unlocked) {
        state.unlocked = true; state.level = 3; state.solved = 3; state.storyProgress = 100;
        updateStatusUI(); save();
        printLine('>>> ACCESS GRANTED <<<', 'success');
        printStory('النظام اتفتح.\n"المنطق مش قواعد جامدة... المنطق هو الطريقة اللي بتشوف بيها العالم."\nمبروك — حليت The Logic Matrix.');
        showToast('تم فتح النظام!', 'success');
      } else printLine('النظام مفتوح بالفعل.', 'system');
      return;
    }
    if (lower === 'help' || lower === 'مساعدة') {
      printLine('الأوامر: help | status | decrypt | message | hint | clear | matrix', 'system');
      return;
    }
    if (lower === 'clear' || lower === 'cls') { terminalOutput.innerHTML = ''; return; }
    if (lower === 'status') {
      printLine(`المستوى: ${state.level}/3 | المحلول: ${state.solved} | ${state.unlocked ? 'مفتوح' : 'مقفل'}`, 'system');
      return;
    }
    if (lower === 'hint') {
      printLine($('#current-hint').textContent, 'system');
      return;
    }
    if (lower === 'message') {
      if (state.level <= 2) printLine(encrypted[state.level] || encrypted[2], 'story');
      else printLine('لا رسائل إضافية. جرب كلمة المرور النهائية.', 'system');
      return;
    }
    if (lower === 'matrix') {
      printLine('The Logic Matrix — صُمم ليختبر طريقة تفكيرك.', 'system');
      return;
    }
    if (lower === 'decrypt' || lower.startsWith('decrypt')) {
      if (state.level === 1) {
        printLine('الرسالة تحتوي أرقامًا مخفية. استخرجها من مختبر المنطق أو اكتب 99214480', 'system');
        printLine(encrypted[1], 'story');
      } else if (state.level === 2) {
        printLine('النص معكوس. استخدم بلوك العكس.', 'system');
        printLine(encrypted[2], 'story');
      } else printLine('كل الشفرات محلولة.', 'system');
      return;
    }
    if (state.level === 1 && (cmd === '99214480' || cmd === '9921-4480')) {
      state.level = 2; state.solved = 1; state.storyProgress = 45;
      updateStatusUI(); save();
      printLine('✓ Level 1 Complete', 'success');
      printStory('كويس. رسالة Level 2:\n' + encrypted[2]);
      showToast('المستوى 1 اكتمل!', 'success');
      return;
    }
    if (state.level === 2 && (lower === 'the key is buried in the stack' || lower.replace(/\s/g, '') === 'thekeyisburiedinthestack')) {
      state.level = 3; state.solved = 2; state.storyProgress = 75;
      updateStatusUI(); save();
      printLine('✓ Level 2 Complete', 'success');
      printStory('فاضل المفتاح الأخير. جرب abogallab أو 4-2-2-2');
      showToast('المستوى 2 اكتمل!', 'success');
      return;
    }
    printLine('أمر غير معروف: ' + cmd, 'error');
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { processCommand(terminalInput.value); terminalInput.value = ''; }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.historyIndex > 0) { state.historyIndex--; terminalInput.value = state.terminalHistory[state.historyIndex] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.historyIndex < state.terminalHistory.length - 1) { state.historyIndex++; terminalInput.value = state.terminalHistory[state.historyIndex] || ''; }
      else { state.historyIndex = state.terminalHistory.length; terminalInput.value = ''; }
    }
  });

  // ---------- Mind Map ----------
  const notesInput = $('#notes-input');
  const mindmapSvg = $('#mindmap-svg');
  const mindmapCanvas = $('#mindmap-canvas');

  function parseNotesToTree(text) {
    const lines = text.split('\n').filter((l) => l.trim());
    const root = { id: 'root', text: 'The Logic Matrix', children: [], depth: 0 };
    const stack = [{ node: root, indent: -1 }];
    lines.forEach((line, idx) => {
      let content = line.trimStart();
      if (/^[•\-\*]\s*/.test(content)) content = content.replace(/^[•\-\*]\s*/, '');
      else if (/^\d+[\.\)]\s*/.test(content)) content = content.replace(/^\d+[\.\)]\s*/, '');
      if (!content) return;
      const indent = line.length - line.trimStart().length;
      const node = { id: 'n' + idx, text: content.slice(0, 55), children: [], depth: 0 };
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const parent = stack[stack.length - 1].node;
      node.depth = parent.depth + 1;
      parent.children.push(node);
      stack.push({ node, indent });
    });
    return root;
  }

  function flattenTree(node, nodes = [], links = [], parentId = null) {
    nodes.push(node);
    if (parentId) links.push({ source: parentId, target: node.id });
    node.children.forEach((c) => flattenTree(c, nodes, links, node.id));
    return { nodes, links };
  }

  function layoutTree(root) {
    const { nodes, links } = flattenTree(root);
    const levels = {};
    nodes.forEach((n) => { if (!levels[n.depth]) levels[n.depth] = []; levels[n.depth].push(n); });
    Object.keys(levels).forEach((d) => {
      const arr = levels[d];
      const totalH = arr.length * 54;
      const startY = -totalH / 2 + 27;
      arr.forEach((n, i) => {
        if (!state.nodePositions[n.id]) state.nodePositions[n.id] = { x: 70 + (+d) * 130, y: startY + i * 54 + 180 };
      });
    });
    return { nodes, links };
  }

  function renderMindmap() {
    const tree = parseNotesToTree(notesInput.value || '');
    const { nodes, links } = layoutTree(tree);
    const w = mindmapCanvas.clientWidth || 500;
    const h = mindmapCanvas.clientHeight || 360;
    mindmapSvg.setAttribute('viewBox', `${-state.pan.x / state.zoom} ${-state.pan.y / state.zoom} ${w / state.zoom} ${h / state.zoom}`);
    mindmapSvg.innerHTML = '';

    const gL = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    links.forEach((l) => {
      const s = state.nodePositions[l.source], t = state.nodePositions[l.target];
      if (!s || !t) return;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const mx = (s.x + t.x) / 2;
      p.setAttribute('d', `M ${s.x + 65} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${t.x - 8} ${t.y}`);
      p.setAttribute('class', 'mind-link');
      gL.appendChild(p);
    });
    mindmapSvg.appendChild(gL);

    const gN = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodes.forEach((n) => {
      const pos = state.nodePositions[n.id] || { x: 80, y: 100 };
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'mind-node' + (n.id === 'root' ? ' root' : ''));
      g.setAttribute('data-id', n.id);
      g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
      const boxW = Math.max(80, Math.min(n.text.length, 26) * 7.5 + 20);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', -8); rect.setAttribute('y', -17); rect.setAttribute('width', boxW); rect.setAttribute('height', 34);
      g.appendChild(rect);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', boxW / 2 - 8); text.setAttribute('y', 1);
      text.textContent = n.text.length > 26 ? n.text.slice(0, 24) + '…' : n.text;
      g.appendChild(text);
      g.addEventListener('pointerdown', (e) => { e.stopPropagation(); dragNode = n.id; g.setPointerCapture(e.pointerId); });
      gN.appendChild(g);
    });
    mindmapSvg.appendChild(gN);
    $('#node-count').textContent = nodes.length + ' عقدة';
  }

  notesInput.addEventListener('input', () => {
    state.notes = notesInput.value;
    renderMindmap();
    debouncedSave();
    const st = $('#notes-save-status');
    if (st) st.textContent = 'جاري الحفظ...';
    setTimeout(() => { if (st) st.textContent = 'محفوظ'; }, 700);
  });

  mindmapCanvas.addEventListener('pointerdown', (e) => {
    if (dragNode) return;
    isPanning = true;
    panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
    mindmapCanvas.setPointerCapture(e.pointerId);
  });
  mindmapCanvas.addEventListener('pointermove', (e) => {
    if (dragNode) {
      const rect = mindmapCanvas.getBoundingClientRect();
      state.nodePositions[dragNode] = {
        x: (e.clientX - rect.left - state.pan.x) / state.zoom,
        y: (e.clientY - rect.top - state.pan.y) / state.zoom,
      };
      renderMindmap();
      return;
    }
    if (isPanning) {
      state.pan.x = e.clientX - panStart.x;
      state.pan.y = e.clientY - panStart.y;
      renderMindmap();
    }
  });
  mindmapCanvas.addEventListener('pointerup', () => { if (dragNode || isPanning) debouncedSave(); dragNode = null; isPanning = false; });
  mindmapCanvas.addEventListener('pointercancel', () => { dragNode = null; isPanning = false; });

  $('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + 0.15); $('#zoom-level').textContent = Math.round(state.zoom * 100) + '%'; renderMindmap(); debouncedSave(); });
  $('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(0.4, state.zoom - 0.15); $('#zoom-level').textContent = Math.round(state.zoom * 100) + '%'; renderMindmap(); debouncedSave(); });
  $('#center-map').addEventListener('click', () => { state.pan = { x: 0, y: 0 }; state.zoom = 1; $('#zoom-level').textContent = '100%'; renderMindmap(); debouncedSave(); });
  $('#reset-positions').addEventListener('click', () => { state.nodePositions = {}; renderMindmap(); showToast('تم إعادة الترتيب'); });
  $('#clear-notes').addEventListener('click', () => { notesInput.value = ''; state.notes = ''; state.nodePositions = {}; renderMindmap(); save(); });
  $('#load-sample').addEventListener('click', () => {
    notesInput.value = `• الرسالة Level 1\n  • MSG-X7: ALPHA-9921-BETA-4480-GAMMA\n  • استخراج الأرقام\n• الرسالة Level 2\n  • kcatS eht ni deirrub si yek eht\n  • النص معكوس\n• المفتاح النهائي\n  • abogallab\n  • 4-2-2-2`;
    state.notes = notesInput.value;
    state.nodePositions = {};
    renderMindmap();
    save();
    showToast('تم تحميل العينة');
  });

  // ---------- Logic Blocks (click + drag) ----------
  const dropZone = $('#drop-zone');

  function getBlockValues(el) {
    return Array.from(el.querySelectorAll('.block-input, .block-select')).map((i) => i.value);
  }

  function blockLabel(type, vals) {
    const map = {
      'if-starts': `إذا بدأ بـ "${vals[0] || '?'}"`,
      'if-contains': `إذا احتوى "${vals[0] || '?'}"`,
      'if-length': `الطول ${vals[0] || '>'} ${vals[1] || '?'}`,
      extract: 'استخرج الأرقام', reverse: 'اعكس النص', uppercase: 'Uppercase',
      replace: `استبدل "${vals[0] || '?'}" → "${vals[1] || '?'}"`,
      repeat: `كرر ×${vals[0] || 2}`,
    };
    return map[type] || type;
  }

  function addBlock(type, values) {
    state.workspaceBlocks.push({ id: 'b' + Date.now() + Math.random().toString(36).slice(2, 5), type, values: values || [] });
    renderWorkspace();
    generateCode();
    debouncedSave();
  }

  function renderWorkspace() {
    dropZone.classList.toggle('has-blocks', state.workspaceBlocks.length > 0);
    $$('.workspace-block').forEach((e) => e.remove());
    state.workspaceBlocks.forEach((b) => {
      const div = document.createElement('div');
      div.className = 'workspace-block';
      div.innerHTML = `<span class="block-icon">◈</span><span class="block-label"></span><button class="move-up" type="button" aria-label="تحريك لأعلى">↑</button><button class="move-down" type="button" aria-label="تحريك لأسفل">↓</button><button class="remove-btn" aria-label="حذف البلوك">×</button>`;
      div.querySelector('.block-label').textContent = blockLabel(b.type, b.values);
      div.draggable = true;
      div.dataset.blockId = b.id;
      div.addEventListener('dragstart', (e) => { e.dataTransfer.setData('matrix-reorder', b.id); div.classList.add('dragging'); });
      div.addEventListener('dragend', () => div.classList.remove('dragging'));
      div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drop-target'); });
      div.addEventListener('dragleave', () => div.classList.remove('drop-target'));
      div.addEventListener('drop', (e) => {
        e.preventDefault(); div.classList.remove('drop-target');
        const movingId = e.dataTransfer.getData('matrix-reorder');
        if (!movingId || movingId === b.id) return;
        const from = state.workspaceBlocks.findIndex(x => x.id === movingId);
        const to = state.workspaceBlocks.findIndex(x => x.id === b.id);
        if (from < 0 || to < 0) return;
        const [moving] = state.workspaceBlocks.splice(from, 1);
        state.workspaceBlocks.splice(to, 0, moving);
        renderWorkspace(); generateCode(); debouncedSave();
      });
      div.querySelector('.remove-btn').onclick = () => {
        state.workspaceBlocks = state.workspaceBlocks.filter((x) => x.id !== b.id);
        renderWorkspace(); generateCode(); debouncedSave();
      };
      const moveBlock = (delta) => {
        const from = state.workspaceBlocks.findIndex(x => x.id === b.id);
        const to = Math.max(0, Math.min(state.workspaceBlocks.length - 1, from + delta));
        if (from < 0 || from === to) return;
        const [item] = state.workspaceBlocks.splice(from, 1);
        state.workspaceBlocks.splice(to, 0, item);
        renderWorkspace(); generateCode(); debouncedSave();
      };
      div.querySelector('.move-up').onclick = () => moveBlock(-1);
      div.querySelector('.move-down').onclick = () => moveBlock(1);
      dropZone.appendChild(div);
    });
  }

  function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]; }); }

  function generateCode() {
    if (!state.workspaceBlocks.length) {
      $('#generated-code').innerHTML = '<code>// أضف بلوكات...</code>';
      $('#flowchart').innerHTML = '<div class="flow-empty">—</div>';
      return;
    }
    const lines = ['function process(input) {', '  let result = input;'];
    const jsString = (value) => JSON.stringify(String(value ?? ''));
    let flow = '<div class="flow-node start">input</div><div class="flow-arrow">↓</div>';
    state.workspaceBlocks.forEach((b) => {
      const v = b.values;
      switch (b.type) {
        case 'if-starts': lines.push(`  if (result.startsWith(${jsString(v[0] || '')})) { /* matched */ }`); flow += `<div class="flow-node condition">يبدأ "${escapeHTML(v[0] || '?')}"؟</div><div class="flow-arrow">↓</div>`; break;
        case 'if-contains': lines.push(`  if (result.includes(${jsString(v[0] || '')})) { /* matched */ }`); flow += `<div class="flow-node condition">يحتوي "${escapeHTML(v[0] || '?')}"؟</div><div class="flow-arrow">↓</div>`; break;
        case 'if-length': { const cmp = ['>', '<', '==', '>=', '<=', '!='].includes(v[0]) ? v[0] : '>'; const n = Math.max(0, Math.min(1000000, Number(v[1]) || 0)); lines.push(`  if (result.length ${cmp} ${n}) { /* matched */ }`); flow += `<div class="flow-node condition">طول ${cmp} ${n}</div><div class="flow-arrow">↓</div>`; break; }
        case 'extract': lines.push(`  result = result.replace(/\\D/g, '');`); flow += `<div class="flow-node action">استخرج الأرقام</div><div class="flow-arrow">↓</div>`; break;
        case 'reverse': lines.push(`  result = result.split('').reverse().join('');`); flow += `<div class="flow-node action">اعكس</div><div class="flow-arrow">↓</div>`; break;
        case 'uppercase': lines.push(`  result = result.toUpperCase();`); flow += `<div class="flow-node action">Uppercase</div><div class="flow-arrow">↓</div>`; break;
        case 'replace': lines.push(`  result = result.split(${jsString(v[0] || '')}).join(${jsString(v[1] || '')});`); flow += `<div class="flow-node action">استبدل</div><div class="flow-arrow">↓</div>`; break;
        case 'repeat': { const count = Math.max(1, Math.min(1000, parseInt(v[0], 10) || 2)); lines.push(`  result = result.repeat(${count});`); flow += `<div class="flow-node action">×${count}</div><div class="flow-arrow">↓</div>`; break; }
      }
    });
    lines.push('  return result;', '}');
    $('#generated-code').textContent = lines.join('\n');
    flow += '<div class="flow-node end">result</div>';
    $('#flowchart').innerHTML = flow;
  }

  // Click to add (more reliable than drag on mobile)
  $$('.block').forEach((block) => {
    block.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      addBlock(block.dataset.type, getBlockValues(block));
      showToast('تمت الإضافة');
    });
    // Also support HTML5 drag for desktop
    block.setAttribute('draggable', 'true');
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', block.dataset.type);
      e.dataTransfer.setData('values', JSON.stringify(getBlockValues(block)));
    });
  });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.getData('matrix-reorder')) return;
    const type = e.dataTransfer.getData('text/plain');
    let values = [];
    try { values = JSON.parse(e.dataTransfer.getData('values') || '[]'); } catch (_) {}
    if (type) addBlock(type, values);
  });

  $('#clear-workspace').addEventListener('click', () => { state.workspaceBlocks = []; renderWorkspace(); generateCode(); save(); });
  $('#copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText($('#generated-code').textContent).then(() => showToast('تم النسخ', 'success')).catch(() => showToast('فشل النسخ', 'error'));
  });

  // ---------- Code Lab (safe JS) ----------
  const snippets = [
    { title: 'FizzBuzz', lang: 'javascript', code: 'for (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0) console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else console.log(i);\n}' },
    { title: 'عكس نص', lang: 'javascript', code: 'function reverse(s) {\n  return s.split("").reverse().join("");\n}\nconsole.log(reverse("Logic Matrix"));' },
    { title: 'فلترة أرقام', lang: 'javascript', code: 'const msg = "ALPHA-9921-BETA-4480";\nconsole.log(msg.replace(/\\D/g, ""));' },
    { title: 'قائمة بايثون', lang: 'python', code: 'nums = [3, 1, 4, 1, 5]\nprint(sorted(nums))\nprint(sum(nums))' },
    { title: 'قاموس', lang: 'python', code: 'user = {"name": "Mohamed", "role": "Student"}\nprint(user["name"])\nprint(user.get("role"))' },
    { title: 'بطاقة HTML', lang: 'html', code: '<div class="card">\n  <h2>Logic Matrix</h2>\n  <p>بيئة العمل</p>\n</div>' },
    { title: 'Glass CSS', lang: 'css', code: '.glass {\n  background: rgba(42,28,18,0.45);\n  backdrop-filter: blur(20px);\n  border-radius: 16px;\n}' },
  ];

  function initCodeLab() {
    const list = $('#snippet-list');
    list.innerHTML = '';
    snippets.forEach((s) => {
      const el = document.createElement('div');
      el.className = 'snippet-item';
      el.innerHTML = `${s.title}<span class="snip-lang">${s.lang}</span>`;
      el.onclick = () => {
        $$('.snippet-item').forEach((i) => i.classList.remove('active'));
        el.classList.add('active');
        $('#snippet-title').textContent = s.title;
        $('#code-editor').value = s.code;
        $('#code-lang').value = s.lang;
        state.codeEditor = s.code;
        debouncedSave();
      };
      list.appendChild(el);
    });

    $('#code-editor').addEventListener('input', () => { state.codeEditor = $('#code-editor').value; debouncedSave(); });
    $('#code-lang').addEventListener('change', () => { state.codeLang = $('#code-lang').value; debouncedSave(); });

    $('#copy-snippet').onclick = () => {
      navigator.clipboard.writeText($('#code-editor').value).then(() => showToast('تم النسخ', 'success'));
    };
    $('#clear-code-output').onclick = () => { $('#code-result').textContent = 'جاهز للتشغيل...'; };

    $('#run-snippet').onclick = () => {
      const code = $('#code-editor').value;
      const lang = $('#code-lang').value;
      const out = $('#code-result');
      if (lang === 'javascript') {
        try {
          const logs = [];
          const fakeConsole = { log: (...a) => logs.push(a.map(String).join(' ')), warn: (...a) => logs.push('[warn] ' + a.join(' ')), error: (...a) => logs.push('[error] ' + a.join(' ')) };
          const frame = document.createElement('iframe');
          frame.setAttribute('sandbox', 'allow-scripts');
          frame.hidden = true;
          document.body.appendChild(frame);
          const payload = JSON.stringify(code);
          const runner = `const logs=[]; const c={log:(...a)=>logs.push(a.join(' ')),warn:(...a)=>logs.push('[warn] '+a.join(' ')),error:(...a)=>logs.push('[error] '+a.join(' '))}; try { (new Function('console', '"use strict";\\n'+${payload}))(c); parent.postMessage({kind:'matrix-js-result',logs},'*'); } catch(e) { parent.postMessage({kind:'matrix-js-error',message:e.message},'*'); }`;
          const timeout = setTimeout(() => {
            window.removeEventListener('message', receive);
            if (frame.isConnected) frame.remove();
            out.textContent = 'تم إيقاف الكود بعد 5 ثوانٍ لتجنب تعليق المحرر.';
          }, 5000);
          const receive = (event) => {
            if (event.source !== frame.contentWindow || !event.data || !String(event.data.kind).startsWith('matrix-js-')) return;
            clearTimeout(timeout);
            window.removeEventListener('message', receive);
            frame.remove();
            out.textContent = event.data.kind === 'matrix-js-error' ? 'خطأ: ' + event.data.message : (event.data.logs.join('\\n') || '(تم بدون خرج)');
          };
          window.addEventListener('message', receive);
          frame.srcdoc = '<script>' + runner.replace(/<\/script/gi, '<\\/script') + '</script>';
        } catch (err) {
          out.textContent = 'خطأ: ' + err.message;
        }
      } else if (lang === 'python') {
        out.textContent = 'جارٍ تشغيل Python...';
        ensurePythonRuntime().then(async (runtime) => {
          await runtime.loadPackagesFromImports(code);
          const result = await runtime.runPythonAsync(code);
          if (result !== undefined && result !== null) out.textContent = String(result);
          else if (out.textContent === 'جارٍ تشغيل Python...') out.textContent = '(تم التنفيذ — راجع مخرجات Python في الطرفية)';
        }).catch((err) => { out.textContent = 'خطأ: ' + (err.message || err); });
      } else {
        out.textContent = 'معاينة ' + lang.toUpperCase() + ':\n\n' + code;
      }
    };
  }

  // ---------- Prompts (Business focused) ----------
  const promptTemplates = [
    { cat: 'إدارة أعمال', items: [
      { title: 'تحليل SWOT', body: 'أنت مستشار إداري. اعمل تحليل SWOT كامل لـ: {{topic}}\nالمستوى: {{level}}\nاللغة: {{lang}}\nقدّم نقاط واضحة لكل ربع مع توصيات عملية.' },
      { title: 'خطة تسويق', body: 'صمم خطة تسويق مختصرة لـ: {{topic}}\nالجمهور المستهدف، القنوات، الميزانية التقريبية، ومؤشرات النجاح.\nالمستوى: {{level}} | اللغة: {{lang}}' },
      { title: 'دراسة جدوى مبسطة', body: 'اكتب دراسة جدوى أولية لمشروع: {{topic}}\nشمل: الفكرة، السوق، التكاليف التقديرية، الإيرادات المتوقعة، والمخاطر.\nاللغة: {{lang}}' },
      { title: 'تحليل منافسين', body: 'حلل المنافسين الرئيسيين في مجال: {{topic}}\nقارن نقاط القوة والضعف والتسعير والتموضع.\nالمستوى: {{level}}' },
      { title: 'خطة عمل Business Plan', body: 'أنشئ Business Plan لمشروع {{topic}} لطالب Business Administration. غطِّ المشكلة والحل والقيمة المقترحة والسوق والعملاء ونموذج الإيرادات والتشغيل والمخاطر وخطة التنفيذ. افصل الافتراضات عن الحقائق.' },
      { title: 'تحليل PESTEL', body: 'حلل {{topic}} باستخدام PESTEL. اشرح العوامل السياسية والاقتصادية والاجتماعية والتكنولوجية والبيئية والقانونية، ثم حدد أثر كل عامل ودرجة أهميته.' },
      { title: 'دراسة حالة إدارية', body: 'أنشئ Case Study واقعية عن {{topic}} تشمل خلفية الشركة والمشكلة والبيانات والبدائل. لا تكشف الحل أولًا. اطرح أسئلة تحليلية ثم قدم نموذج إجابة.' },
      { title: 'إدارة الموارد البشرية', body: 'اشرح موضوع {{topic}} في HR لطالب إدارة أعمال. اربطه بالتوظيف والتدريب وتقييم الأداء والتحفيز، مع مثال تطبيقي ومؤشرات قياس.' },
      { title: 'إدارة العمليات', body: 'حلل عملية {{topic}} من منظور Operations Management. وضح المدخلات والعمليات والمخرجات والاختناقات والجودة وKPIs واقترح تحسينات.' },
      { title: 'سلوك تنظيمي', body: 'اشرح {{topic}} في Organizational Behavior مع نظريات أساسية ومثال من شركة وأسئلة نقاش.' },
      { title: 'إدارة استراتيجية', body: 'ضع تحليلًا استراتيجيًا لـ {{topic}} باستخدام Porter وSWOT وميزة تنافسية قابلة للقياس.' },
      { title: 'عرض تقديمي جامعي', body: 'أنشئ عرضًا جامعيًا عن {{topic}} من 8 إلى 10 شرائح. لكل شريحة عنوان ونقاط وملاحظات متحدث ومراجع موثوقة. اجعل المحتوى مناسبًا لطالب Business Administration.' },
    ]},
    { cat: 'محاسبة ومالية', items: [
      { title: 'شرح مفهوم محاسبي', body: 'اشرح مفهوم "{{topic}}" بطريقة بسيطة لطالب بكالوريوس إدارة أعمال.\nاستخدم مثال رقمي واضح.\nاللغة: {{lang}}' },
      { title: 'تحليل قوائم مالية', body: 'كيف أحلل قائمة الدخل والميزانية لشركة في قطاع: {{topic}}؟\nاذكر النسب المالية الأهم ومعنى كل نسبة.\nالمستوى: {{level}}' },
    ]},
    { cat: 'برمجة', items: [
      { title: 'شرح كود', body: 'اشرح الكود التالي باللهجة المصرية مع توضيح كل جزء:\n```\n{{topic}}\n```\nالمستوى: {{level}} | اللغة: {{lang}}' },
      { title: 'توليد دالة', body: 'اكتب دالة {{lang}} تقوم بـ: {{topic}}\nكود نظيف + تعليقات + مثال استخدام.\nالمستوى: {{level}}' },
    ]},
    { cat: 'دراسة وامتحانات', items: [
      { title: 'تلخيص محاضرة', body: 'لخّص الموضوع التالي في نقاط مرتبة وسهلة الحفظ:\n{{topic}}\nالمستوى: {{level}} | اللغة: {{lang}}' },
      { title: 'أسئلة مراجعة', body: 'ولّد 10 أسئلة مراجعة (مع إجاباتها المختصرة) عن: {{topic}}\nنوع الأسئلة: مفاهيم + تطبيق.\nالمستوى: {{level}}' },
      { title: 'خطة مذاكرة', body: 'ضع خطة مذاكرة لأسبوع لموضوع: {{topic}}\nوزّع الوقت يوميًا وحدد أولويات.\nالمستوى: {{level}}' },
    ]},
    { cat: 'علوم البيانات والذكاء الاصطناعي', items: [
      { title: 'تحليل بيانات', body: 'حلل مجموعة البيانات التالية/الموضوع {{topic}}. اقترح تنظيف البيانات والتحليل الاستكشافي والرسوم والمقاييس والاستنتاجات. اذكر حدود التحليل.' },
      { title: 'فكرة مشروع AI', body: 'اقترح مشروع ذكاء اصطناعي عملي لـ {{topic}} مع المشكلة والبيانات والنموذج والتقييم والمخاطر وخطة MVP.' },
      { title: 'شرح خوارزمية', body: 'اشرح خوارزمية {{topic}} من الصفر مع مثال يدوي وتعقيد زمني ومساحة وكود توضيحي.' }
    ]},
    { cat: 'هندسة البرمجيات', items: [
      { title: 'مراجعة كود', body: 'راجع الكود التالي: {{topic}}. اكتشف الأخطاء والثغرات ومشاكل الأداء وقابلية الصيانة. اقترح إصلاحات واختبارات.' },
      { title: 'تصميم نظام', body: 'صمم نظامًا لـ {{topic}}. اشرح المعمارية والوحدات وتدفق البيانات والتخزين والأمان والاختبارات وخطة النشر.' },
      { title: 'اختبارات برمجية', body: 'اكتب Test Plan لـ {{topic}} يشمل Unit وIntegration وEnd-to-End وحالات الحواف ومعايير القبول.' },
      { title: 'تصحيح خطأ', body: 'حلل الخطأ التالي في {{topic}}. حدد السبب الجذري وخطوات إعادة الإنتاج والإصلاح واختبار يمنع تكراره.' }
    ]},
    { cat: 'التسويق والمبيعات', items: [
      { title: 'حملة تسويقية متكاملة', body: 'صمم حملة تسويقية لـ {{topic}} تشمل الهدف والجمهور والرسالة والقنوات والميزانية والجدول الزمني وKPIs وخطة قياس النتائج.' },
      { title: 'استراتيجية علامة تجارية', body: 'ابنِ Brand Strategy لـ {{topic}} تشمل التموضع والوعد والقيم ونبرة الصوت وشخصية العلامة والتميّز عن المنافسين.' },
      { title: 'خطة محتوى شهرية', body: 'أنشئ Content Calendar لمدة 30 يومًا لـ {{topic}} مع المنصة والفكرة والهدف ونوع المحتوى وCTA ومؤشر قياس.' },
      { title: 'قمع المبيعات', body: 'صمم Sales Funnel لـ {{topic}} من الوعي حتى الاحتفاظ. حدد نقاط التحويل والاعتراضات ومؤشرات الأداء.' }
    ]},
    { cat: 'الاقتصاد والإحصاء', items: [
      { title: 'شرح مفهوم اقتصادي', body: 'اشرح {{topic}} لطالب Business Administration. استخدم تعريفًا ومثالًا رقميًا ورسمة وصفية وأثره على قرارات الشركات.' },
      { title: 'حل مسألة إحصاء', body: 'حل المسألة التالية خطوة بخطوة: {{topic}}. اذكر القانون والتعويض والوحدات والتحقق من الناتج.' },
      { title: 'تحليل نقطة التعادل', body: 'احسب Break-even Analysis لـ {{topic}} مع التكاليف الثابتة والمتغيرة وسعر البيع وهامش المساهمة وتحليل الحساسية.' },
      { title: 'تفسير بيانات', body: 'فسر نتائج {{topic}} إحصائيًا. وضح المتوسط والوسيط والانحراف المعياري والارتباط وحدود الاستنتاج.' }
    ]},
    { cat: 'مهارات الطالب الجامعي', items: [
      { title: 'تحويل المحاضرة إلى مذاكرة', body: 'حوّل محتوى {{topic}} إلى ملخص منظم ومصطلحات أساسية وأمثلة وأسئلة استرجاع نشط.' },
      { title: 'بطاقات مراجعة', body: 'أنشئ Flashcards عن {{topic}} بصيغة سؤال ثم إجابة قصيرة، وركز على الفهم لا الحفظ فقط.' },
      { title: 'اختبار تجريبي', body: 'أنشئ امتحانًا جامعيًا عن {{topic}} بمستويات صعوبة متنوعة، ثم ضع نموذج الإجابة ومعايير التصحيح في قسم منفصل.' },
      { title: 'خطة قبل الامتحان', body: 'ضع خطة مراجعة واقعية لـ {{topic}} حسب الوقت المتاح، مع جلسات استرجاع وتدريب وأسئلة ومراجعة الأخطاء.' }
    ]},
    { cat: 'تطوير الويب والواجهات', items: [
      { title: 'بناء تطبيق ويب متكامل', body: 'تصرف كمهندس برمجيات Senior. ابنِ تطبيق ويب لـ {{topic}} باستخدام HTML وCSS وJavaScript. قدم هيكل الملفات، واجهة Responsive، إدارة الحالة، التحقق من المدخلات، معالجة الأخطاء، اختبارات، وتعليمات تشغيل. لا تستخدم مكتبات خارجية إلا عند الضرورة.' },
      { title: 'تصميم UI/UX احترافي', body: 'صمم تجربة UI/UX لـ {{topic}}. حدد المستخدمين والمهام وتدفق الاستخدام ونظام التصميم والألوان والطباعة والحالات الفارغة والأخطاء وإمكانية الوصول.' },
      { title: 'تحويل تصميم إلى كود', body: 'حوّل وصف/تصميم {{topic}} إلى كود منظم. حافظ على Responsive layout وSemantic HTML وCSS variables ودعم لوحة المفاتيح.' },
      { title: 'PWA تعمل أوفلاين', body: 'أنشئ PWA لـ {{topic}} مع Web App Manifest وService Worker وCache strategy وتحديثات آمنة وحفظ محلي واختبار Offline. اشرح حدود التخزين.' }
    ]},
    { cat: 'Python وهندسة البيانات', items: [
      { title: 'مشروع Python منظم', body: 'أنشئ مشروع Python لـ {{topic}} بهيكل احترافي، modules، type hints، docstrings، logging، exceptions، requirements، README واختبارات pytest.' },
      { title: 'تصحيح أخطاء Python', body: 'حلل كود Python التالي: {{topic}}. حدد الخطأ الجذري، اشرح سبب حدوثه، قدم إصلاحًا minimal ثم نسخة محسنة واختبارات تمنع تكراره.' },
      { title: 'تحليل بيانات Pandas', body: 'ابنِ pipeline لتحليل {{topic}} باستخدام pandas. افحص البيانات المفقودة والتكرارات والأنواع والقيم الشاذة ثم اعرض إحصاءات ورسومًا واستنتاجات قابلة للتحقق.' },
      { title: 'خوارزميات وهياكل بيانات', body: 'اشرح ونفذ {{topic}} في Python. اعرض الفكرة، pseudocode، التعقيد الزمني والمساحي، حالات الحواف، واختبارات.' }
    ]},
    { cat: 'DevOps والسحابة', items: [
      { title: 'Dockerize مشروع', body: 'جهز {{topic}} للعمل عبر Docker. اكتب Dockerfile و.dockerignore وdocker-compose عند الحاجة، مع multi-stage build وnon-root user وhealthcheck وشرح التشغيل.' },
      { title: 'تصميم بنية سحابية', body: 'صمم Cloud Architecture لـ {{topic}}. وضح الخدمات ومناطق الفشل والتوسع والتكلفة والأمان والنسخ الاحتياطي والمراقبة.' },
      { title: 'Linux للمطورين', body: 'أنشئ دليلًا عمليًا لموضوع {{topic}} في Linux. اشرح الأوامر مع أمثلة آمنة ومخرجات متوقعة وأخطاء شائعة.' }
    ]},
    { cat: 'هندسة البرمجيات المتقدمة', items: [
      { title: 'Refactoring احترافي', body: 'أعد هيكلة الكود التالي: {{topic}} مع الحفاظ على السلوك الحالي. حدد code smells، اقترح خطوات صغيرة، وأضف اختبارات قبل وبعد.' },
      { title: 'System Design Interview', body: 'درّبني على تصميم نظام {{topic}}. ابدأ بالمتطلبات، تقدير الحمل، API، schema، architecture، caching، queues، scalability، trade-offs ونقاط الفشل.' },
      { title: 'تحليل الأداء', body: 'حلل أداء {{topic}} وحدد bottlenecks المحتملة. اقترح profiling وقياسات baseline وتحسينات مرتبة حسب الأثر والمخاطر.' },
      { title: 'كتابة Documentation', body: 'اكتب Documentation للمشروع {{topic}} تشمل overview وinstallation وconfiguration وusage وAPI وtroubleshooting وcontributing.' }
    ]},
    { cat: 'قواعد البيانات وواجهات API', items: [
      { title: 'تصميم قاعدة بيانات', body: 'صمم قاعدة بيانات لـ {{topic}}. حدد الكيانات والعلاقات والمفاتيح والقيود والفهارس والتطبيع واكتب SQL schema وبيانات تجريبية.' },
      { title: 'REST API كاملة', body: 'صمم REST API لـ {{topic}} تشمل endpoints وHTTP methods وstatus codes وvalidation وauthentication وpagination وerror format وOpenAPI documentation.' },
      { title: 'تحسين SQL', body: 'راجع استعلام SQL التالي: {{topic}}. اشرح Query Plan المتوقع، الفهارس المناسبة، مخاطر الأداء، واقترح نسخة محسنة.' }
    ]},
    { cat: 'الأمن والاختبارات والنشر', items: [
      { title: 'مراجعة أمنية للكود', body: 'نفذ Security Code Review لـ {{topic}}. ابحث عن OWASP Top 10 وحقن المدخلات وتسريب البيانات والصلاحيات. صنف الخطورة واقترح إصلاحات واختبارات.' },
      { title: 'خطة اختبارات شاملة', body: 'أنشئ خطة اختبار لـ {{topic}} تشمل Unit وIntegration وE2E وRegression وAccessibility وحالات الحواف ومعايير القبول.' },
      { title: 'CI/CD Pipeline', body: 'صمم CI/CD لـ {{topic}} مع lint وtests وbuild وsecurity checks وdeployment وrollback. اكتب ملف workflow واشرح الأسرار والصلاحيات.' },
      { title: 'مراجعة Pull Request', body: 'راجع التغييرات التالية كأنك Code Reviewer: {{topic}}. ركز على bugs وsecurity وperformance وreadability وtests. اكتب ملاحظات محددة حسب الأولوية.' }
    ]},
    { cat: 'الإنتاجية والعمل', items: [
      { title: 'إدارة مشروع', body: 'حوّل {{topic}} إلى خطة مشروع بمراحل ومهام واعتماديات ومخاطر ومؤشرات إنجاز.' },
      { title: 'كتابة بريد احترافي', body: 'اكتب بريدًا مهنيًا عن {{topic}} بنبرة واضحة ومختصرة مع عنوان مناسب وطلب محدد.' },
      { title: 'تحضير مقابلة', body: 'جهزني لمقابلة عن {{topic}}. قدم أسئلة متدرجة وإجابات نموذجية وطريقة تقييم.' }
    ]},
  ];

  function initPrompts() {
    const box = $('#prompt-categories');
    box.innerHTML = '';
    let totalPrompts = promptTemplates.reduce((n, c) => n + c.items.length, 0);
    const countEl = $('#prompt-count'); if (countEl) countEl.textContent = totalPrompts + ' قالب';
    promptTemplates.forEach((cat) => {
      const t = document.createElement('div');
      t.className = 'prompt-cat-title';
      t.textContent = cat.cat;
      box.appendChild(t);
      cat.items.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'prompt-item';
        el.textContent = item.title;
        el.dataset.search = (cat.cat + ' ' + item.title + ' ' + item.body).toLowerCase();
        el.onclick = () => {
          $$('.prompt-item').forEach((i) => i.classList.remove('active'));
          el.classList.add('active');
          $('#prompt-title').textContent = item.title;
          $('#prompt-editor').value = item.body;
          state.promptText = item.body;
          debouncedSave();
        };
        box.appendChild(el);
      });
    });
    $('#prompt-editor').addEventListener('input', () => { state.promptText = $('#prompt-editor').value; debouncedSave(); });
    const promptSearch = $('#prompt-search'); if (promptSearch) promptSearch.addEventListener('input', () => { const q = promptSearch.value.toLowerCase(); $$('.prompt-item').forEach(el => el.hidden = !el.dataset.search.includes(q)); $$('.prompt-cat-title').forEach(cat => { let next = cat.nextElementSibling, show = false; while(next && !next.classList.contains('prompt-cat-title')) { if(next.classList.contains('prompt-item') && !next.hidden) show = true; next = next.nextElementSibling; } cat.hidden = !show; }); });
    $('#copy-prompt').onclick = () => navigator.clipboard.writeText($('#prompt-editor').value).then(() => showToast('تم النسخ', 'success'));
    $('#clear-prompt').onclick = () => { $('#prompt-editor').value = ''; state.promptText = ''; $('#prompt-title').textContent = 'مختبر البرومبت'; save(); };
    $('#apply-vars').onclick = () => {
      let t = $('#prompt-editor').value;
      t = t.replaceAll('{{topic}}', $('#var-topic').value || '{{topic}}')
           .replaceAll('{{level}}', $('#var-level').value || '{{level}}')
           .replaceAll('{{lang}}', $('#var-lang').value || '{{lang}}');
      $('#prompt-editor').value = t;
      state.promptText = t;
      showToast('تم التطبيق');
      debouncedSave();
    };
  }

  // ---------- Real Python runtime (Pyodide / WebAssembly) ----------
  let pyodideInstance = null;
  let pyodideLoading = null;
  async function ensurePythonRuntime() {
    const status = $('#py-runtime-status');
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) return pyodideLoading;
    pyodideLoading = (async () => {
      status.textContent = 'Python runtime: جاري تحميل مفسر Python الحقيقي (أول مرة تحتاج إنترنت)...';
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('تعذر تحميل Pyodide. افتح التطبيق مرة مع الإنترنت ثم أعد المحاولة.'));
          document.head.appendChild(script);
        });
      }
      pyodideInstance = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
      pyodideInstance.setStdout({ batched: (text) => pyPrint(text) });
      pyodideInstance.setStderr({ batched: (text) => pyPrint(text, 'error') });
      status.textContent = 'Python runtime: جاهز — CPython عبر WebAssembly';
      return pyodideInstance;
    })().catch((err) => {
      status.textContent = 'Python runtime: غير متاح — ' + err.message;
      pyodideLoading = null;
      throw err;
    });
    return pyodideLoading;
  }

  function initPython() {
    const cmds = [
      { c: 'print("Hello, Matrix Studio")', d: 'طباعة' },
      { c: 'nums = [3, 1, 4, 1, 5]\nprint(sorted(nums))\nprint(sum(nums))', d: 'قوائم وحساب' },
      { c: 'for i in range(5):\n    print(i)', d: 'حلقة تكرار' },
      { c: 'def square(n):\n    return n ** 2\nprint(square(8))', d: 'دوال' },
      { c: 'import statistics\nvalues = [2, 4, 4, 8]\nprint(statistics.mean(values))', d: 'مكتبات' },
      { c: 'student = {"major": "Business", "year": 1}\nprint(student["major"])', d: 'قاموس' },
    ];
    const list = $('#py-commands');
    list.innerHTML = '';
    cmds.forEach((item) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'py-cmd';
      el.textContent = item.c;
      const small = document.createElement('small');
      small.textContent = item.d;
      el.appendChild(small);
      el.addEventListener('click', () => { $('#py-input').value = item.c; $('#py-input').focus(); });
      list.appendChild(el);
    });

    const pyOut = $('#py-output');
    window.pyPrint = function (value, type = '') {
      const d = document.createElement('div');
      d.className = 'line' + (type ? ' ' + type : '');
      d.textContent = String(value);
      pyOut.appendChild(d);
      pyOut.scrollTop = pyOut.scrollHeight;
    };
    pyPrint('Matrix Studio — CPython WebAssembly', 'system');
    pyPrint('مفسر Python حقيقي. يدعم الحلقات والدوال والقوائم والمكتبات القياسية.', 'system');

    $('#py-input').addEventListener('input', () => { state.pyCode = $('#py-input').value; debouncedSave(); });
    $('#py-input').addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        const code = $('#py-input').value.trim();
        if (!code) return;
        pyPrint('>>> ' + code, 'prompt-echo');
        $('#py-input').value = '';
        try {
          const runtime = await ensurePythonRuntime();
          await runtime.loadPackagesFromImports(code);
          const result = await runtime.runPythonAsync(code);
          if (result !== undefined && result !== null) pyPrint(String(result));
          debouncedSave();
        } catch (err) {
          pyPrint('خطأ: ' + (err.message || err), 'error');
        }
      }
    });
  }

  // ---------- Settings ----------
  function initSettings() {
    $('#theme-toggle').onclick = () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(); save();
      showToast(state.theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح');
    };

    $$('[data-theme-set]').forEach((b) => {
      b.onclick = () => { state.theme = b.dataset.themeSet; applyTheme(); save(); };
    });
    $$('[data-fontsize]').forEach((b) => {
      b.onclick = () => { state.fontSize = +b.dataset.fontsize; applyTheme(); save(); };
    });

    $('#setting-animations').onchange = (e) => { state.animations = e.target.checked; save(); };
    $('#setting-watermark').onchange = (e) => { state.watermark = e.target.checked; applyTheme(); save(); };
    $('#setting-autosave').onchange = (e) => {
      const enabled = e.target.checked;
      if (!enabled) {
        state.autosave = true; save(); state.autosave = false;
        try { const snapshot = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); snapshot.autosave = false; localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch (_) {}
      } else { state.autosave = true; save(); }
      showToast(enabled ? 'تم تفعيل الحفظ التلقائي' : 'تم إيقاف الحفظ التلقائي');
    };

    // sync checkboxes
    $('#setting-animations').checked = state.animations;
    $('#setting-watermark').checked = state.watermark;
    $('#setting-autosave').checked = state.autosave;

    $('#export-data').onclick = () => {
      const data = localStorage.getItem(STORAGE_KEY) || '{}';
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'logic-matrix-backup.json';
      a.click();
      showToast('تم التصدير', 'success');
    };

    $('#import-data').onclick = () => $('#import-file').click();
    $('#import-file').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem(STORAGE_KEY, reader.result);
          load();
          applyTheme();
          notesInput.value = state.notes;
          $('#code-editor').value = state.codeEditor;
    $('#code-lang').value = state.codeLang || 'javascript';
    $('#py-input').value = state.pyCode || '';
          $('#prompt-editor').value = state.promptText;
          renderWorkspace();
          generateCode();
          updateStatusUI();
          showToast('تم الاستيراد', 'success');
        } catch { showToast('ملف غير صالح', 'error'); }
      };
      reader.readAsText(file);
    };

    $('#reset-all').onclick = () => {
      if (!confirm('هل أنت متأكد؟ سيتم مسح كل البيانات.')) return;
      localStorage.removeItem(STORAGE_KEY);
      state = { level: 1, solved: 0, unlocked: false, storyProgress: 15, notes: '', workspaceBlocks: [], codeEditor: '', codeLang: 'javascript', promptText: '', pyCode: '', theme: 'dark', fontSize: 18, animations: true, watermark: true, autosave: true, nodePositions: {}, zoom: 1, pan: { x: 0, y: 0 }, terminalHistory: [], historyIndex: -1 };
      applyTheme();
      notesInput.value = '';
      $('#code-editor').value = '';
      $('#code-lang').value = 'javascript';
      $('#py-input').value = '';
      $('#prompt-editor').value = '';
      renderWorkspace();
      generateCode();
      updateStatusUI();
      terminalOutput.innerHTML = '';
      bootTerminal();
      showToast('تمت إعادة الضبط');
    };
  }


  // ---------- Project explorer, snippets and configuration ----------
  const defaultShortcuts = [
    ['VS Code','Ctrl + Shift + P','Command Palette'],['VS Code','Ctrl + P','فتح ملف سريع'],['VS Code','Ctrl + `','فتح الطرفية'],['VS Code','Alt + Shift + F','تنسيق الملف'],['VS Code','Ctrl + D','تحديد التكرار التالي'],['VS Code','Ctrl + Shift + K','حذف السطر'],
    ['Git','git init','إنشاء مستودع'],['Git','git status','حالة الملفات'],['Git','git add .','تجهيز التغييرات'],['Git','git commit -m "message"','حفظ نقطة إصدار'],['Git','git branch','عرض الفروع'],['Git','git switch -c feature/name','إنشاء فرع والانتقال إليه'],['Git','git pull','سحب آخر تحديث'],['Git','git push -u origin main','رفع الفرع'],
    ['Terminal','pwd','المسار الحالي'],['Terminal','ls -la','عرض الملفات'],['Terminal','cd folder','الدخول لمجلد'],['Terminal','mkdir project','إنشاء مجلد'],['Terminal','touch app.py','إنشاء ملف'],['Terminal','python -m venv .venv','بيئة افتراضية'],['Terminal','pip install package','تثبيت حزمة'],['Terminal','pip freeze > requirements.txt','تصدير الاعتمادات'],
    ['Python','python app.py','تشغيل ملف'],['Python','python -m pytest','تشغيل الاختبارات'],['Python','python -m http.server 8000','خادم ملفات محلي'],['JavaScript','node app.js','تشغيل Node.js'],['JavaScript','npm install','تثبيت الاعتمادات'],['JavaScript','npm run dev','تشغيل وضع التطوير'],['JavaScript','npm run build','إنشاء نسخة الإنتاج'],
    ['HTML/CSS','! ثم Tab','هيكل HTML عبر Emmet'],['HTML/CSS','display: grid','شبكة CSS'],['HTML/CSS','display: flex','Flexbox'],['HTML/CSS','@media (max-width: 768px)','تصميم متجاوب'],['Debugging','console.table(data)','عرض بيانات كجدول'],['Debugging','debugger;','نقطة توقف'],['Debugging','try { } catch (error) { }','معالجة الاستثناءات'],
    ['Python','python -m venv .venv','إنشاء بيئة افتراضية'],['Python','python -m pip install -r requirements.txt','تثبيت المتطلبات'],['Python','python -m pytest -q','تشغيل الاختبارات'],['Git','git switch -c feature/name','إنشاء فرع جديد'],['Git','git add . && git commit -m \"feat: update\"','إضافة التغييرات وإنشاء commit'],['Git','git pull --rebase && git push','مزامنة ورفع التغييرات'],['Node.js','npm init -y','إنشاء package.json'],['Node.js','npm install','تثبيت الاعتماديات'],['Node.js','npm run dev','تشغيل سكربت التطوير'],['JSON','JSON.parse(text)','تحويل JSON إلى object'],['API','fetch(url).then(r => r.json())','طلب بيانات من API']
  ];
  function renderShortcuts(filter='') { const box=$('#shortcut-grid'); if(!box)return; box.innerHTML=''; defaultShortcuts.filter(x=>x.join(' ').toLowerCase().includes(filter.toLowerCase())).forEach(([group,cmd,desc])=>{const card=document.createElement('article');card.className='shortcut-card glass';const g=document.createElement('span');g.className='eyebrow';g.textContent=group;const c=document.createElement('code');c.textContent=cmd;const d=document.createElement('p');d.textContent=desc;const b=document.createElement('button');b.className='btn-sm';b.textContent='نسخ الأمر';b.onclick=()=>copyText(cmd);card.append(g,c,d,b);box.append(card);}); }
  function copyText(value){const fallback=()=>{const t=document.createElement('textarea');t.value=value;document.body.append(t);t.select();document.execCommand('copy');t.remove();showToast('تم النسخ');}; if(navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(()=>showToast('تم النسخ')).catch(fallback); else fallback();}
  function renderProjects(){const list=$('#project-list');if(!list)return;list.innerHTML='';if(!state.projects.length){const p=document.createElement('p');p.className='muted';p.textContent='لا توجد مشاريع. أنشئ مشروعك الأول.';list.append(p);}state.projects.forEach(project=>{const wrap=document.createElement('div');wrap.className='project-entry';const h=document.createElement('button');h.className='project-name';h.textContent='▸ '+project.name;h.onclick=()=>{state.activeProject=project.id;renderProjects();save();};wrap.append(h);if(state.activeProject===project.id){project.files.forEach(file=>{const f=document.createElement('button');f.className='project-file'+(state.activeFile===file.id?' active':'');f.textContent='  '+file.name;f.onclick=()=>openProjectFile(project.id,file.id);wrap.append(f);});}list.append(wrap);});}
  function openProjectFile(pid,fid){const pr=state.projects.find(x=>x.id===pid),file=pr?.files.find(x=>x.id===fid);if(!file)return;state.activeProject=pid;state.activeFile=fid;$('#project-file-title').textContent=file.name;$('#project-file-editor').value=file.content;$('#project-file-meta').textContent=new Blob([file.content]).size+' bytes';renderProjects();}
  function initProjects(){const $id=x=>document.getElementById(x);$id('new-project').onclick=()=>{const name=prompt('اسم المشروع؟');if(!name?.trim())return;const id='p'+Date.now();state.projects.push({id,name:name.trim(),files:[{id:'f'+Date.now(),name:'README.md',content:'# '+name.trim()+'\n\nمشروعي باستخدام MATRIX STUDIO PRO.'}]});state.activeProject=id;save();renderProjects();showToast('تم إنشاء المشروع');};$id('new-file').onclick=()=>{const pr=state.projects.find(x=>x.id===state.activeProject);if(!pr){showToast('أنشئ أو اختر مشروعًا أولًا','error');return;}const name=prompt('اسم الملف مع الامتداد؟','main.py');if(!name?.trim())return;const f={id:'f'+Date.now(),name:name.trim(),content:''};pr.files.push(f);openProjectFile(pr.id,f.id);save();};$id('save-project-file').onclick=()=>{const pr=state.projects.find(x=>x.id===state.activeProject),f=pr?.files.find(x=>x.id===state.activeFile);if(!f){showToast('اختر ملفًا أولًا','error');return;}f.content=$id('project-file-editor').value;save();$id('project-file-meta').textContent=new Blob([f.content]).size+' bytes';$id('project-save-state').textContent='SAVED';showToast('تم حفظ الملف');};$id('project-file-editor').addEventListener('input',()=>{$id('project-save-state').textContent='MODIFIED';const pr=state.projects.find(x=>x.id===state.activeProject),f=pr?.files.find(x=>x.id===state.activeFile);if(f){f.content=$id('project-file-editor').value;debouncedSave();}});$id('download-project').onclick=()=>{const pr=state.projects.find(x=>x.id===state.activeProject);if(!pr){showToast('اختر مشروعًا','error');return;}const blob=new Blob([JSON.stringify(pr,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=pr.name.replace(/[^a-z0-9-_]/gi,'_')+'-project.json';a.click();URL.revokeObjectURL(a.href);};renderProjects();}
  function renderConfigurations(){const c=state.configurations||{},ids={workspace:'cfg-workspace',python:'cfg-python',js:'cfg-js',runtime:'cfg-runtime',timeout:'cfg-timeout'};Object.entries(ids).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.value=c[k]??({workspace:'MATRIX WORKSPACE',python:'3.12',js:'ES2023',runtime:'offline',timeout:3000}[k]);});const env=$('#env-list');if(!env)return;env.innerHTML='';(c.env||[]).forEach((v,i)=>{const row=document.createElement('div');row.className='env-row';const k=document.createElement('input');k.placeholder='KEY';k.value=v.key;const val=document.createElement('input');val.placeholder='VALUE';val.value=v.value;const del=document.createElement('button');del.className='btn-sm danger';del.textContent='حذف';del.onclick=()=>{state.configurations.env.splice(i,1);renderConfigurations();save();};row.append(k,val,del);k.oninput=val.oninput=()=>{v.key=k.value;v.value=val.value;syncConfigJSON();debouncedSave();};env.append(row);});syncConfigJSON();}
  function syncConfigJSON(){const el=$('#config-json');if(el)el.value=JSON.stringify(state.configurations,null,2);}
  function initConfigurations(){const read=()=>{const c=state.configurations;c.workspace=$('#cfg-workspace').value;c.python=$('#cfg-python').value;c.js=$('#cfg-js').value;c.runtime=$('#cfg-runtime').value;c.timeout=Math.max(100,Math.min(10000,Number($('#cfg-timeout').value)||3000));syncConfigJSON();save();};['cfg-workspace','cfg-python','cfg-js','cfg-runtime','cfg-timeout'].forEach(id=>{const e=$('#'+id);e.addEventListener('input',read);e.addEventListener('change',read);});$('#env-add').onclick=()=>{state.configurations.env.push({key:'NEW_KEY',value:''});renderConfigurations();save();};$('#config-save').onclick=()=>{read();showToast('تم حفظ Configurations');};$('#config-reset').onclick=()=>{state.configurations={workspace:'MATRIX WORKSPACE',python:'3.12',js:'ES2023',runtime:'offline',timeout:3000,env:[]};renderConfigurations();save();showToast('تمت استعادة الإعدادات');};$('#config-export').onclick=()=>{const blob=new Blob([JSON.stringify(state.configurations,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='config.json';a.click();URL.revokeObjectURL(a.href);};$('#config-apply-json').onclick=()=>{try{const v=JSON.parse($('#config-json').value);if(!v||typeof v!=='object'||Array.isArray(v))throw Error();state.configurations={...state.configurations,...v};renderConfigurations();save();showToast('تم تطبيق الإعدادات');}catch{showToast('JSON غير صالح','error');}};$('#config-copy-json').onclick=()=>copyText($('#config-json').value);renderConfigurations();}

  // ---------- Init ----------
  function init() {
    load();
    applyTheme();
    updateStatusUI();
    notesInput.value = state.notes;
    if (state.codeEditor) $('#code-editor').value = state.codeEditor;
    $('#code-lang').value = state.codeLang || 'javascript';
    $('#py-input').value = state.pyCode || '';
    if (state.promptText) $('#prompt-editor').value = state.promptText;
    renderWorkspace();
    generateCode();
    bootTerminal();
    renderMindmap();
    initCodeLab();
    initPrompts();
    initPython();
    initSettings();
    initProjects();
    initConfigurations();
    renderShortcuts();
    const shortcutSearch = $('#shortcut-search'); if(shortcutSearch) shortcutSearch.addEventListener('input',()=>renderShortcuts(shortcutSearch.value));
    setTimeout(() => terminalInput.focus(), 200);
    document.addEventListener('keydown', (e) => { if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();showToast('تم الحفظ محليًا');} if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();switchPanel('shortcuts');$('#shortcut-search')?.focus();} });
    window.addEventListener('resize', () => {
      if ($('#panel-mindmap').classList.contains('active')) renderMindmap();
    });
  }

  init();
})();
