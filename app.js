// app.js — full frontend logic for Sara AI (vanilla JS)
// Replace API_BASE with your deployed backend URL (no trailing slash).
const API_BASE = 'https://sara-ai-backend.onrender.com';

const syllabus = {
  "Theory of structures": {
    desc: "Direct and bending stresses, slope & deflection, fixed & continuous beams, columns, moment distribution.",
    units: [
      { title: "Unit 1: Direct and Bending Stresses", topics: ["Direct & eccentric loads", "Stress distribution", "Core of section for rectangular & circular"] },
      { title: "Unit 2: Slope and Deflection", topics: ["Relation between M, slope, deflection", "Double integration", "Macaulay & moment area methods"] },
      { title: "Unit 3: Fixed Beam", topics: ["Fixed end moments", "Superposition"] },
      { title: "Unit 4: Continuous Beam", topics: ["Clapeyron’s three moment theorem", "SFD & BMD for continuous & fixed beams"] },
      { title: "Unit 5: Moment Distribution Method", topics: ["Carry over & stiffness factor", "Applications up to 3 spans"] },
      { title: "Unit 6: Columns", topics: ["Classification & slenderness", "Euler & Rankine theories"] }
    ]
  },
  "Building Planning and Drawing with AutoCAD": {
    desc: "Conventions & symbols, building planning, load bearing & framed drawing, perspective, CAD commands.",
    units: [
      { title: "Unit 1: Conventions & Symbols", topics: ["Symbols for materials", "Line types, lettering & scales"] },
      { title: "Unit 2: Planning of Building", topics: ["Principles of planning", "Line plans for 3-room house"] },
      { title: "Unit 3: Load Bearing Drawing", topics: ["2BHK single-storey drawing", "Working drawing & foundation plan"] },
      { title: "Unit 4: Framed Structure", topics: ["G+1 framed residential drawing", "Details of RCC footing, beam, slab"] },
      { title: "Unit 5: Perspective Drawing", topics: ["Two-point perspective"] },
      { title: "Unit 6: Drawing with CAD", topics: ["CAD commands", "3D drawing basics"] }
    ]
  },
  "Soil Mechanics and Foundation": {
    desc: "Soil properties, permeability, compaction, shear strength, stabilization & bearing capacity.",
    units: [
      { title: "Unit 1: Overview", topics: ["Soil definition & classification", "Field applications"] },
      { title: "Unit 2: Physical & Index Properties", topics: ["Water content", "Atterberg limits", "Specific gravity"] },
      { title: "Unit 3: Permeability", topics: ["Darcy’s law", "Flow net basics"] },
      { title: "Unit 4: Compaction & Shear Strength", topics: ["Proctor test", "Shear tests & Mohr-Coulomb"] },
      { title: "Unit 5: Stabilization & Bearing Capacity", topics: ["Terzaghi’s analysis", "Plate load test"] }
    ]
  },
  "Transportation Engineering": {
    desc: "Highway engineering, geometric design, materials & construction, basics of railway engineering.",
    units: [
      { title: "Unit 1: Overview", topics: ["Role of transportation", "Modes & classification of roads"] },
      { title: "Unit 2: Geometric Design", topics: ["Design speed", "Camber, sight distance, curves"] },
      { title: "Unit 3: Materials & Construction", topics: ["Aggregates tests", "Flexible & rigid pavements"] },
      { title: "Unit 4: Railway Basics", topics: ["Permanent way & components"] },
      { title: "Unit 5: Track Geometrics", topics: ["Super elevation", "Points & crossings"] }
    ]
  },
  "Advance Surveying": {
    desc: "Plane table, theodolite, tacheometry, total station, remote sensing, GPS & GIS.",
    units: [
      { title: "Unit 1: Plane Table", topics: ["Principles & methods"] },
      { title: "Unit 2: Theodolite", topics: ["Transit theodolite use & adjustments"] },
      { title: "Unit 3: Tacheometry & curves", topics: ["Tacheometer formulae", "Curve setting"] },
      { title: "Unit 4: Advanced equipment", topics: ["EDM, total station"] },
      { title: "Unit 5: Remote Sensing & GIS", topics: ["GPS, GIS & drone surveying"] }
    ]
  }
};

/* ----------------- DOM refs ----------------- */
const subjectsGrid = document.getElementById('subjectsGrid');
const home = document.getElementById('home');
const unitsView = document.getElementById('units');
const topicsView = document.getElementById('topics');
const breadcrumb = document.getElementById('breadcrumb');
const responseArea = document.getElementById('responseArea');

let currentSubject = null, currentUnit = null, currentTopic = null;
let controller = null, utter = null;

/* ----------------- Populate subjects ----------------- */
Object.keys(syllabus).forEach(subj=>{
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="title">${subj}</div><div class="meta">${syllabus[subj].desc}</div>`;
  card.addEventListener('click', ()=> openSubject(subj));
  subjectsGrid.appendChild(card);
});

/* ----------------- Navigation handlers ----------------- */
document.getElementById('backToSubjects').onclick = ()=> showView('home');
document.getElementById('backToUnits').onclick = ()=> showView('units');
document.getElementById('restart').onclick = ()=> location.reload();

function showView(v){
  home.classList.add('hidden'); unitsView.classList.add('hidden'); topicsView.classList.add('hidden');
  if(v==='home') home.classList.remove('hidden');
  if(v==='units') unitsView.classList.remove('hidden');
  if(v==='topics') topicsView.classList.remove('hidden');
  breadcrumb.textContent = v==='home'?'Home':(v==='units'?currentSubject:'Topics');
}

function openSubject(subj){
  currentSubject = subj;
  document.getElementById('subjectTitle').textContent = subj;
  document.getElementById('subjectDesc').textContent = syllabus[subj].desc;
  const list = document.getElementById('unitsList'); list.innerHTML = '';
  syllabus[subj].units.forEach((u,idx)=>{
    const c = document.createElement('div'); c.className = 'unitCard';
    c.innerHTML = `<strong>${u.title}</strong><div style='opacity:.8;margin-top:6px;font-size:13px'>${u.topics.slice(0,3).join(' • ')}</div>`;
    c.addEventListener('click', ()=> openUnit(idx)); list.appendChild(c);
  });
  showView('units');
}

function openUnit(idx){
  currentUnit = syllabus[currentSubject].units[idx];
  document.getElementById('unitTitle').textContent = currentUnit.title;
  document.getElementById('unitDesc').textContent = currentUnit.topics.join(', ');
  const tlist = document.getElementById('topicList'); tlist.innerHTML = '';
  currentUnit.topics.forEach(t=>{
    const el = document.createElement('div'); el.className = 'topic'; el.textContent = t;
    el.addEventListener('click', ()=> selectTopic(t));
    tlist.appendChild(el);
  });
  showView('topics');
}

/* ----------------- Language modal flow ----------------- */
const langModal = document.getElementById('langModal');
let chosenLang = 'en';
document.getElementById('askLanguageBtn').addEventListener('click', ()=> langModal.classList.remove('hidden'));
langModal.querySelectorAll('button[data-lang]').forEach(b=>b.addEventListener('click', ()=>{
  chosenLang = b.dataset.lang; langModal.classList.add('hidden'); runChatRequest(currentTopic, chosenLang);
}));

function selectTopic(t){
  currentTopic = t; langModal.classList.remove('hidden');
}

/* ----------------- Run Chat Request ----------------- */
async function runChatRequest(topic, lang){
  if(!topic) return alert('No topic selected');

  responseArea.innerHTML = `<em>Requesting explanation for <strong>${topic}</strong> (language: ${lang==='hi'?'Hindi':'English'}) ...</em>`;

  // Build a careful prompt with formatting instructions (AI will use LaTeX when asked)
  const prompt = `You are a clear college-level teacher. Explain the topic "${topic}" from the subject ${currentSubject}.
Give:
1) A short definition.
2) Step-by-step explanation with numbered steps.
3) Key formulas using LaTeX (denote formulas with $...$).
4) One worked example (simple).
5) A short summary.
Use emojis where helpful. Format with headings, **bold** for important terms, *italic* for notes.
Write the whole answer in ${lang==='hi' ? 'Hindi' : 'English'}.`;

  // Abort previous if running
  if(controller) controller.abort();
  controller = new AbortController();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ prompt })
    });

    if(!res.ok) {
      // Attempt to parse server error body
      const errText = await res.text().catch(()=>res.statusText);
      throw new Error(`Server responded ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.text || 'No response from server';
    responseArea.innerHTML = renderFormatting(text);
    speakText(text, lang);

  } catch(err){
    if(err.name === 'AbortError') {
      responseArea.innerHTML = '<em>Request aborted.</em>';
    } else {
      responseArea.innerHTML = `<em style="color:#fca5a5">Error: ${escapeHtml(err.message)}</em>`;
      console.error('runChatRequest error:', err);
    }
  }
}

/* ----------------- Formatting & LaTeX ----------------- */
function renderFormatting(txt){
  if(!txt) return '<p>No content</p>';

  // Try to render KaTeX if present: replace $...$ with rendered HTML
  let work = escapeHtml(txt);

  // Render inline LaTeX ($...$). We'll detect $...$ and replace with katex if available.
  work = work.replace(/\$(.+?)\$/gs, (m, expr) => {
    // expr is escaped HTML text now; unescape for katex rendering
    const rawExpr = unescapeHtml(expr);
    if(window.katex && typeof window.katex.renderToString === 'function'){
      try {
        return window.katex.renderToString(rawExpr, { throwOnError: false });
      } catch (e) {
        return `<code>${escapeHtml(rawExpr)}</code>`;
      }
    } else {
      // fallback: show inline code-looking text
      return `<code>${escapeHtml(rawExpr)}</code>`;
    }
  });

  // Bold and italic: convert **bold** and *italic*
  work = work.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  work = work.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Split by lines and convert lists
  const lines = work.split(/\r?\n/);
  let out = '';
  let inList = false;
  lines.forEach(line => {
    if(/^\s*[-*]\s+/.test(line)){
      if(!inList){ out += '<ul>'; inList = true; }
      out += `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`;
    } else if(/^\s*\d+\.\s+/.test(line)){
      if(!inList){ out += '<ul>'; inList = true; }
      out += `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
    } else {
      if(inList){ out += '</ul>'; inList = false; }
      if(line.trim() === '') out += '<br/>'; else out += `<p>${line}</p>`;
    }
  });
  if(inList) out += '</ul>';

  return out;
}

/* ----------------- TTS (Text-to-Speech) ----------------- */
function speakText(text, lang){
  if(!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch(e){ /* ignore */ }

  // Prefer shorter text to speak; we will speak the plain text, not HTML
  const plain = textToPlain(text);
  utter = new SpeechSynthesisUtterance(plain);
  utter.lang = (lang === 'hi' ? 'hi-IN' : 'en-IN');
  utter.rate = 0.95;
  utter.pitch = 1;

  // choose a voice matching language if available
  const voices = window.speechSynthesis.getVoices();
  if(voices && voices.length){
    const v = voices.find(v=>v.lang.toLowerCase().startsWith(utter.lang.split('-')[0])) || voices[0];
    if(v) utter.voice = v;
  }

  window.speechSynthesis.speak(utter);
}

/* Stop button */
document.getElementById('stopSpeech').addEventListener('click', ()=> {
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  if(controller) controller.abort();
});

/* Copy result to clipboard */
document.getElementById('copyBtn').addEventListener('click', ()=>{
  const t = responseArea.innerText;
  navigator.clipboard.writeText(t).then(()=> alert('Copied to clipboard')).catch(()=> alert('Unable to copy'));
});

/* Splash enter behavior */
document.getElementById('enterBtn').addEventListener('click', ()=> {
  const s = document.getElementById('splash');
  s.style.pointerEvents = 'none';
  s.style.opacity = '0';
  setTimeout(()=> s.remove(), 900);
});

/* Escape makes sure to stop speech and abort request */
window.addEventListener('keydown', (e)=> {
  if(e.key === 'Escape'){
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(controller) controller.abort();
  }
});

/* ----------------- Small helpers ----------------- */
function textToPlain(text){
  // If text arrived with markup, strip tags to read plain
  return text.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s{2,}/g,' ').trim();
}

function escapeHtml(unsafe){
  if(unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function unescapeHtml(s){
  return String(s)
    .replaceAll('&amp;','&')
    .replaceAll('&lt;','<')
    .replaceAll('&gt;','>')
    .replaceAll('&quot;','"')
    .replaceAll('&#039;',"'");
}

/* Convert simple model output to plain readable text before speaking, or fallback if it's already plain */
function stripMarkdown(md){
  // remove markdown headings, emphasis symbols, and lists bullets for speech
  return md.replace(/[#*_`]/g,'').replace(/[-*]\s+/g,'').replace(/\n{2,}/g,'\n').trim();
}

/* Convert markup to plain; used for TTS when the server returns markdown-like text */
function plainFromServer(text){
  // If server returned JSON with plain text, use it; else strip markup
  return stripMarkdown(text);
}
