/* MATRIX STUDIO PRO v7 — mobile-first developer tools */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const KEY = 'matrixStudioPro_v6_workspace';
  const editor = $('#code-editor');
  if (!editor) return;

  const readStore = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const store = readStore();
  let tabs = Array.isArray(store.tabs) && store.tabs.length ? store.tabs : [{id:'main',name:'main.js',lang:'javascript',code:editor.value || '// Welcome to MATRIX STUDIO PRO\nconsole.log("Hello, Mohamed!");'}];
  let active = store.active || tabs[0].id;
  let terminalHistory = [];

  // Brand typography: system fonts only; decorative Unicode signature is part of the identity.
  const brand = document.createElement('div');
  brand.className = 'developer-signature';
  brand.innerHTML = '<span class="signature-kicker">FOUNDER / BUILDER</span><strong>𝑴𝒐𝒉𝒂𝒎𝒆𝒅 𝑺𝒂𝒍𝒂𝒉</strong><span class="signature-meta">BUSINESS STUDENT · SOFTWARE & PYTHON ENTHUSIAST</span>';
  const consolePanel = $('#panel-console');
  const consoleWindow = $('.console-wrapper', consolePanel || document);
  if (consoleWindow) consoleWindow.prepend(brand);

  function persist() {
    const current = getActive();
    if (current) current.code = editor.value;
    try { localStorage.setItem(KEY, JSON.stringify({tabs, active, savedAt:Date.now()})); } catch (e) { toast('مساحة التخزين ممتلئة. صدّر ملفاتك كنسخة احتياطية.'); }
  }
  function toast(message) { const t=$('#toast'); if(t){t.textContent=message;t.className='toast show';setTimeout(()=>t.classList.remove('show'),2400);} }
  function getActive(){ return tabs.find(t=>t.id===active) || tabs[0]; }
  function langFromName(name){ const ext=(name.split('.').pop()||'').toLowerCase(); return ({py:'python',js:'javascript',mjs:'javascript',html:'html',css:'css',json:'json',sql:'sql',sh:'bash',md:'markdown',ts:'typescript',txt:'plaintext'})[ext] || 'plaintext'; }
  function safeName(name){ return (name||'untitled.js').replace(/[^\p{L}\p{N}_.-]/gu,'_').slice(0,60) || 'untitled.js'; }

  // Build a practical offline editor shell around the native textarea (no remote fonts or libraries).
  const wrap = document.createElement('div'); wrap.className='matrix-editor-frame';
  const tabsBar = document.createElement('div'); tabsBar.className='matrix-editor-tabs'; tabsBar.setAttribute('role','tablist');
  const tools = document.createElement('div'); tools.className='matrix-editor-tools';
  tools.innerHTML = '<button type="button" data-ed="new">ملف جديد</button><button type="button" data-ed="open">فتح ملف</button><button type="button" data-ed="download">تنزيل</button><button type="button" data-ed="find">بحث / استبدال</button><button type="button" data-ed="format">تنسيق بسيط</button><span class="editor-engine-label">MATRIX EDITOR · OFFLINE</span>';
  const editorParent = editor.parentNode;
  editorParent.insertBefore(wrap, editor);
  wrap.append(tabsBar, tools);
  const codeSurface = document.createElement('div'); codeSurface.className='matrix-code-surface';
  const gutter = document.createElement('div'); gutter.className='matrix-line-numbers'; gutter.setAttribute('aria-hidden','true');
  editorParent.insertBefore(codeSurface, editor);
  codeSurface.append(gutter, editor);
  editor.classList.add('matrix-code-input');
  const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.hidden=true; fileInput.accept='.js,.mjs,.py,.html,.css,.json,.sql,.sh,.md,.txt,.ts';
  editorParent.append(fileInput);

  function syncGutter(){ const n=Math.max(1,editor.value.split('\n').length); gutter.textContent=Array.from({length:n},(_,i)=>i+1).join('\n'); gutter.scrollTop=editor.scrollTop; }
  function renderTabs(){
    tabsBar.innerHTML='';
    tabs.forEach(tab=>{const b=document.createElement('button');b.type='button';b.className='matrix-file-tab'+(tab.id===active?' active':'');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab.id===active));b.textContent=tab.name; b.title=tab.name; b.onclick=()=>activate(tab.id); const x=document.createElement('span');x.textContent='×';x.className='tab-close';x.title='إغلاق الملف';x.onclick=(e)=>{e.stopPropagation();closeTab(tab.id);};b.append(x);tabsBar.append(b);});
  }
  function activate(id){ const old=getActive(); if(old) old.code=editor.value; active=id; const t=getActive(); if(!t)return; editor.value=t.code||''; $('#code-lang').value=t.lang||langFromName(t.name); $('#snippet-title').textContent=t.name; syncGutter();renderTabs();persist(); }
  function closeTab(id){ if(tabs.length===1){toast('لازم يفضل ملف واحد مفتوح');return;} tabs=tabs.filter(t=>t.id!==id); if(active===id) active=tabs[0].id; activate(active); }
  function newTab(name='untitled.js',lang=null,code=''){const id='f'+Date.now()+Math.random().toString(16).slice(2,6);tabs.push({id,name:safeName(name),lang:lang||langFromName(name),code});activate(id);}
  if(!tabs.some(t=>t.id===active)) active=tabs[0].id;
  activate(active);
  editor.addEventListener('input',()=>{syncGutter();const t=getActive();if(t)t.code=editor.value;persist();});
  editor.addEventListener('scroll',()=>{gutter.scrollTop=editor.scrollTop;});
  $('#code-lang').addEventListener('change',e=>{const t=getActive();if(t){t.lang=e.target.value;const ext={javascript:'js',python:'py',html:'html',css:'css',json:'json',sql:'sql',bash:'sh'}[t.lang]||'txt';if(!t.name.includes('.'))t.name+='.'+ext;renderTabs();persist();}});
  tools.addEventListener('click',e=>{const action=e.target.dataset.ed;if(!action)return;
    if(action==='new'){const name=prompt('اسم الملف الجديد','script.js');if(name)newTab(name);}
    if(action==='open')fileInput.click();
    if(action==='download'){const t=getActive();const blob=new Blob([editor.value],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=t.name;a.click();URL.revokeObjectURL(a.href);}
    if(action==='find'){const q=prompt('النص المطلوب البحث عنه');if(q===null)return;const start=editor.value.indexOf(q,editor.selectionStart);if(start>=0){editor.focus();editor.setSelectionRange(start,start+q.length);}else toast('لم يتم العثور على النص');const replacement=prompt('استبدال كل التطابقات؟ اكتب النص البديل أو اتركه فارغًا للإلغاء');if(replacement!==null&&replacement!==''){editor.value=editor.value.split(q).join(replacement);editor.dispatchEvent(new Event('input'));}}
    if(action==='format'){const lang=$('#code-lang').value;if(lang==='json'){try{editor.value=JSON.stringify(JSON.parse(editor.value),null,2);editor.dispatchEvent(new Event('input'));}catch{toast('JSON غير صالح؛ لم يتم تغيير الملف');}}else if(lang==='javascript'||lang==='python'||lang==='css'||lang==='html'){editor.value=editor.value.split('\n').map(line=>line.replace(/[ \t]+$/g,'')).join('\n').replace(/\n{3,}/g,'\n\n');editor.dispatchEvent(new Event('input'));toast('تم تنظيف المسافات الزائدة');}else toast('التنسيق التلقائي المتقدم غير متاح لهذا النوع');}
  });
  fileInput.addEventListener('change',async()=>{const f=fileInput.files?.[0];if(!f)return;newTab(f.name,langFromName(f.name),await f.text());fileInput.value='';});
  editor.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persist();toast('تم حفظ مساحة العمل محليًا');}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();newTab();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();tools.querySelector('[data-ed="find"]').click();}
    if(e.key==='Tab'){e.preventDefault();const a=editor.selectionStart,b=editor.selectionEnd;editor.setRangeText('    ',a,b,'end');editor.dispatchEvent(new Event('input'));}
  });

  // Sandboxed JavaScript execution via a dedicated Worker; no DOM access to the page.
  const runButton=$('#run-snippet');
  if(runButton){runButton.addEventListener('click',e=>{
    if($('#code-lang').value!=='javascript')return;
    e.stopImmediatePropagation();
    const code=editor.value, out=$('#code-result');out.textContent='جاري التنفيذ داخل JavaScript Worker...';
    const workerSource=`const logs=[];const safeConsole={log:(...a)=>logs.push(a.map(String).join(' ')),warn:(...a)=>logs.push('[warn] '+a.join(' ')),error:(...a)=>logs.push('[error] '+a.join(' ')),info:(...a)=>logs.push(a.join(' '))};try{const fn=new Function('console','"use strict";\\n'+${JSON.stringify(code)});const result=fn(safeConsole);if(result!==undefined)logs.push(String(result));postMessage({ok:true,logs});}catch(error){postMessage({ok:false,error:error.name+': '+error.message});}`;
    const blob=new Blob([workerSource],{type:'text/javascript'}), url=URL.createObjectURL(blob), worker=new Worker(url);let done=false;
    const timer=setTimeout(()=>{if(done)return;done=true;worker.terminate();URL.revokeObjectURL(url);out.textContent='تم إيقاف التنفيذ بعد 4 ثوانٍ (Timeout).';},4000);
    worker.onmessage=ev=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);out.textContent=ev.data.ok?(ev.data.logs.join('\n')||'(تم التنفيذ بدون مخرجات)'):'خطأ: '+ev.data.error;};
    worker.onerror=ev=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);out.textContent='Worker Error: '+ev.message;};
    worker.postMessage('run');
  },true);}

  // Browser-based developer command workbench. This is intentionally not a fake OS shell.
  const form=$('#devterminal-form'), input=$('#devterminal-command'), output=$('#devterminal-output');
  function line(text,cls=''){const d=document.createElement('div');d.className='term-line '+cls;d.textContent=text;output.append(d);output.scrollTop=output.scrollHeight;}
  function execute(raw){const cmd=raw.trim();if(!cmd)return;line('mohamed@matrix:~$ '+cmd,'term-command');terminalHistory.push(cmd);if(terminalHistory.length>80)terminalHistory.shift();
    const [head,...rest]=cmd.split(' '), arg=rest.join(' ');
    switch(head.toLowerCase()){
      case 'help': line('الأوامر: help, clear, pwd, ls, whoami, date, echo <text>, matrix, git status, python --version, node --version, run');line('run يشغّل كود JavaScript الموجود في محرر الأكواد داخل Worker معزول.','term-muted');break;
      case 'clear':output.innerHTML='';break;
      case 'pwd':line('/matrix/workspace');break;
      case 'ls':{const p=(JSON.parse(localStorage.getItem('matrixStudioPro_v5')||'{}').projects||[]);line((p.map(x=>x.name||'project').join('    ')||'workspace/  snippets/  configs/')) ;break;}
      case 'whoami':line('𝑴𝒐𝒉𝒂𝒎𝒆𝒅 𝑺𝒂𝒍𝒂𝒉 · MATRIX USER');break;
      case 'date':line(new Date().toString());break;
      case 'echo':line(arg);break;
      case 'matrix':line('╔══════════════════════════════════════╗');line('║  MATRIX STUDIO PRO · DEVELOPER MODE  ║');line('║  CODE  /  LEARN  /  BUILD  /  CREATE ║');line('╚══════════════════════════════════════╝');break;
      case 'git':if(arg==='status'){line('On branch main');line('Local workspace status: browser-stored files are not a Git repository.');line('Use GitHub Desktop or git CLI to commit and push the exported project.','term-muted');}else line('Usage: git status (Git CLI is not installed in this browser sandbox).');break;
      case 'python':line('Python runtime: '+(window.loadPyodide?'Pyodide loader available; افتح مختبر Python لتحميل المحرك.':'يتم تحميل المحرك عند فتح مختبر Python.'));line('Python --version يعرض إصدار المحرك بعد تحميله من صفحة Python.','term-muted');break;
      case 'node':line('Node.js غير مثبت داخل المتصفح. JavaScript يعمل عبر Web Worker المدمج.');break;
      case 'run':runButton?.click();line('تم إرسال كود المحرر إلى مشغل JavaScript المعزول.');break;
      default:line('أمر غير معروف: '+head+' · اكتب help.','term-error');
    }
  }
  form?.addEventListener('submit',e=>{e.preventDefault();execute(input.value);input.value='';});
  input?.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();input.value=terminalHistory.at(-1)||'';} });

  // Additional complete prompt library for practical software engineering work.
  const extraPromptGroups = [
    ['هندسة البرمجيات', [
      ['تصميم نظام متكامل','تصرف كمهندس برمجيات Senior. صمم نظام {{topic}} وحدد المتطلبات الوظيفية وغير الوظيفية، المعمارية، المكونات، تدفق البيانات، قاعدة البيانات، واجهات API، الأمان، الاختبارات، وخطة الإطلاق. اذكر trade-offs والقرارات البديلة.'],
      ['تحويل فكرة إلى MVP','حوّل فكرة {{topic}} إلى MVP قابل للتنفيذ. حدد المستخدمين، المشكلة، نطاق النسخة الأولى، User Stories، معايير القبول، نموذج البيانات، الشاشات، المخاطر، وخطة 4 أسابيع.'],
      ['مراجعة معمارية','راجع معمارية المشروع التالي: {{topic}}. اكتشف نقاط الفشل، الترابط الزائد، مخاطر التوسع، مشاكل الأداء والأمان، ثم اقترح تحسينات تدريجية دون إعادة كتابة غير ضرورية.']
    ]],
    ['Backend وواجهات API', [
      ['REST API احترافي','صمم REST API لـ {{topic}} مع endpoints وHTTP methods وrequest/response JSON وstatus codes وvalidation وpagination وfiltering وauthentication وrate limiting وOpenAPI spec.'],
      ['مصادقة وصلاحيات','صمم نظام Authentication وAuthorization آمنًا لـ {{topic}}. قارن Sessions وJWT، أضف roles وpermissions وrefresh tokens وlogout وpassword reset وحماية CSRF وXSS.'],
      ['اختبار API','أنشئ خطة اختبارات API لـ {{topic}} تشمل happy paths وnegative cases وboundary cases وauth وrate limits وschema validation، واكتب أمثلة عملية.']
    ]],
    ['قواعد البيانات وSQL', [
      ['تصميم قاعدة بيانات','صمم قاعدة بيانات علائقية لـ {{topic}}. حدد الجداول والأعمدة والأنواع والمفاتيح والعلاقات والقيود والفهارس، ثم اكتب SQL لإنشاء المخطط وبيانات تجريبية.'],
      ['تحسين SQL','حلل استعلام SQL التالي: {{topic}}. اشرح خطة التنفيذ المحتملة، واقترح indexes وتحسينات، وانتبه إلى صحة النتائج والتكرار والتعامل مع NULL.'],
      ['NoSQL مقابل SQL','قارن SQL وNoSQL لمشروع {{topic}} وفق العلاقات والاتساق والتوسع والاستعلامات والتكلفة، ثم قدم توصية مبررة.']
    ]],
    ['Python وعلوم البيانات', [
      ['مشروع Python من الصفر','ابنِ مشروع Python لـ {{topic}} باستخدام هيكل مجلدات واضح وvenv وrequirements وtype hints وlogging وexceptions وtests وREADME. اكتب الملفات كاملة مع خطوات التشغيل.'],
      ['تحليل بيانات','حلل بيانات {{topic}} باستخدام Python وPandas. ابدأ بفحص الجودة والقيم المفقودة، ثم EDA، الإحصاءات، الرسوم المناسبة، الاستنتاجات، وحدود التحليل.'],
      ['تصحيح أخطاء Python','راجع كود Python التالي: {{topic}}. حدد سبب الخطأ، قدم أقل تعديل صحيح، اشرح لماذا حدث، وأضف اختبارًا يمنع تكراره.']
    ]],
    ['Frontend وواجهات المستخدم', [
      ['واجهة Dashboard','صمم Dashboard احترافيًا لـ {{topic}} مع responsive layout وaccessibility وحالات loading وempty وerror، ونظام ألوان وثيم داكن وفاتح. لا تستخدم مكتبات خارجية إلا عند تبريرها.'],
      ['تحسين تجربة المستخدم','راجع تجربة المستخدم في {{topic}}. حدد نقاط الاحتكاك، تسلسل المهام، إمكانية الوصول، وضوح الأزرار، ورسائل الخطأ، ثم اقترح تعديلات قابلة للقياس.'],
      ['تحويل تصميم إلى كود','حوّل وصف التصميم التالي إلى HTML وCSS وJavaScript منظم: {{topic}}. افصل الملفات، اجعل التصميم responsive، وراعِ لوحة المفاتيح ودعم قارئ الشاشة.']
    ]],
    ['الأمان والاختبارات', [
      ['مراجعة أمنية','نفذ Threat Modeling لمشروع {{topic}}. حدد الأصول والتهديدات ونقاط الدخول وسوء الاستخدام، ثم اقترح mitigations واختبارات تحقق. لا تفترض أن أي سر مخزن في الواجهة آمن.'],
      ['خطة Unit Tests','اكتب Unit Tests لـ {{topic}} مع حالات طبيعية وحدية وخاطئة. استخدم mocks فقط عند الحاجة، واجعل الاختبارات مستقلة وقابلة للتكرار.'],
      ['تحليل أداء','حلل أداء {{topic}}. حدد bottlenecks المحتملة، طريقة القياس قبل التعديل، تحسينات الذاكرة والشبكة والاستعلامات، ثم معايير نجاح قابلة للقياس.']
    ]],
    ['DevOps وGit', [
      ['Git Workflow','اقترح Git workflow لفريق صغير يعمل على {{topic}}. اشرح branches وcommit conventions وpull requests وcode review وrelease tags وحل conflicts.'],
      ['CI/CD','أنشئ Pipeline لـ {{topic}} تشمل lint وtests وbuild وsecurity scanning وartifact وdeployment وrollback. اشرح secrets والصلاحيات دون كشف أي بيانات حساسة.'],
      ['Dockerize Project','جهز Dockerfile وdocker-compose لمشروع {{topic}} مع multi-stage build وnon-root user وhealthcheck وvolumes وenvironment variables.']
    ]],
    ['ذكاء اصطناعي وPrompt Engineering', [
      ['بناء AI Agent','صمم AI Agent لمهمة {{topic}}. حدد الأدوات والصلاحيات والذاكرة وحدود السياق، إدارة الأخطاء، human approval، التقييم، ومخاطر prompt injection.'],
      ['تقييم البرومبتات','أنشئ Benchmark لتقييم برومبت {{topic}} باستخدام مجموعة حالات متنوعة، rubric واضح، معايير الدقة والالتزام، واختبارات regression.'],
      ['RAG Pipeline','صمم RAG pipeline لـ {{topic}} تشمل ingestion وchunking وembeddings وretrieval وreranking وcitations وevaluation وحماية البيانات.']
    ]],
    ['Business وProduct', [
      ['تحليل منتج تقني','حلل المنتج التقني {{topic}} من منظور Business Administration. حدد القيمة المقترحة والسوق والعملاء والمنافسين ونموذج الإيرادات والتكاليف وKPIs والمخاطر.'],
      ['Product Requirements Document','اكتب PRD لـ {{topic}} يتضمن المشكلة والأهداف والمستخدمين والـ user stories والنطاق خارج النطاق والمتطلبات ومؤشرات النجاح ومعايير القبول.'],
      ['جدوى مشروع برمجي','اعمل دراسة جدوى أولية لمشروع {{topic}} تشمل التكاليف الثابتة والمتغيرة والإيرادات المتوقعة ونقطة التعادل والسيناريوهات والمخاطر. اذكر الافتراضات بوضوح.']
    ]]
  ];
  const promptRoot=$('#prompt-categories');
  if(promptRoot){
    extraPromptGroups.forEach(([category,items])=>{
      const heading=document.createElement('div');heading.className='prompt-cat-title';heading.textContent=category;promptRoot.append(heading);
      items.forEach(([title,body])=>{
        const item=document.createElement('div');item.className='prompt-item';item.textContent=title;item.dataset.search=(category+' '+title+' '+body).toLowerCase();
        item.addEventListener('click',()=>{$$('.prompt-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');$('#prompt-title').textContent=title;$('#prompt-editor').value=body;$('#prompt-editor').focus();});
        promptRoot.append(item);
      });
    });
    const count=$('#prompt-count');if(count){const n=$$('.prompt-item',promptRoot).length;count.textContent=n+' قالب جاهز';}
  }

  // Keyboard shortcuts visible in the app.
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='`'){e.preventDefault();document.querySelector('[data-panel="devterminal"]')?.click();input?.focus();}});

  // Ensure prompt workspace uses the full available panel height and large readable type.
  const promptPanel=$('#panel-prompts');if(promptPanel){promptPanel.style.minHeight='0';const c=$('.prompts-container',promptPanel);if(c)c.style.minHeight='0';}
  document.documentElement.style.setProperty('--font-code','ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
  document.documentElement.style.setProperty('--font-ui','system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif');
  persist();
})();
