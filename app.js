// app.js — vanilla JS frontend logic
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

const subjectsGrid = document.getElementById('subjectsGrid');
const home = document.getElementById('home');
const unitsView = document.getElementById('units');
const topicsView = document.getElementById('topics');
const breadcrumb = document.getElementById('breadcrumb');

let currentSubject = null, currentUnit = null, currentTopic = null;
let controller = null, utter = null;

// populate subjects
Object.keys(syllabus).forEach(subj=>{
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="title">${subj}</div><div class="meta">${syllabus[subj].desc}</div>`;
  card.addEventListener('click', ()=> openSubject(subj));
  subjectsGrid.appendChild(card);
});

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
  currentSubject=subj;
  document.getElementById('subjectTitle').textContent=subj;
  document.getElementById('subjectDesc').textContent=syllabus[subj].desc;
  const list = document.getElementById('unitsList'); list.innerHTML='';
  syllabus[subj].units.forEach((u,idx)=>{
    const c=document.createElement('div'); c.className='unitCard';
    c.innerHTML=`<strong>${u.title}</strong><div style='opacity:.8;margin-top:6px;font-size:13px'>${u.topics.slice(0,3).join(' • ')}</div>`;
    c.addEventListener('click',()=> openUnit(idx)); list.appendChild(c);
  });
  showView('units');
}

function openUnit(idx){
  currentUnit = syllabus[currentSubject].units[idx];
  document.getElementById('unitTitle').textContent = currentUnit.title;
  document.getElementById('unitDesc').textContent = currentUnit.topics.join(', ');
  const tlist = document.getElementById('topicList'); tlist.innerHTML = '';
  currentUnit.topics.forEach(t=>{
    const el = document.createElement('div'); el.className='topic'; el.textContent = t;
    el.addEventListener('click', ()=> selectTopic(t));
    tlist.appendChild(el);
  });
  showView('topics');
}

// language modal flow
const langModal = document.getElementById('langModal');
let chosenLang = 'en';
document.getElementById('askLanguageBtn').addEventListener('click', ()=> langModal.classList.remove('hidden'));
langModal.querySelectorAll('button[data-lang]').forEach(b=>b.addEventListener('click', ()=>{
  chosenLang = b.dataset.lang; langModal.classList.add('hidden'); runChatRequest(currentTopic, chosenLang);
}));

function selectTopic(t){
  currentTopic = t; langModal.classList.remove('hidden');
}

async function runChatRequest(topic, lang){
  if(!topic) return alert('No topic selected');
  const responseArea = document.getElementById('responseArea');
  responseArea.innerHTML = `<em>Requesting explanation for <strong>${topic}</strong> (language: ${lang==='hi'?'Hindi':'English'}) ...</em>`;

  const prompt = `Explain the topic: "${topic}" from the perspective of ${currentSubject} — include: a short definition, a stepwise detailed explanation, key formulas or concepts if any, example or simple problem, and a summary. Use emojis where helpful. Format the answer with clear headings, **bold** important terms, *italicize* subtle notes, and present bullet points or numbered steps. Keep language ${lang==='hi'?'Hindi':'English'}. Use LaTeX for formulas where needed.`;

  if(controller) controller.abort();
  controller = new AbortController();

  try {
    const res = await fetch('https://sara-ai-backend.onrender.com', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal: controller.signal,
      body: JSON.stringify({prompt, lang, topic, subject:currentSubject})
    });
    if(!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    const text = data.text || 'No response';
    responseArea.innerHTML = renderFormatting(text);
    speakText(text, lang);
  } catch(err){
    if(err.name === 'AbortError') responseArea.innerHTML = '<em>Request aborted.</em>';
    else responseArea.innerHTML = `<em style="color:#fca5a5">Error: ${err.message}</em>`;
  }
}

function renderFormatting(txt){
  // basic **bold** and *italic* and list to HTML render
  let out = txt.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g,'<em>$1</em>');
  out = out.split('\n').map(line=>{
    if(/^\s*[-*]\s+/.test(line)) return '<li>'+line.replace(/^\s*[-*]\s+/, '')+'</li>';
    if(/^\s*\d+\.\s+/.test(line)) return '<li>'+line.replace(/^\s*\d+\.\s+/, '')+'</li>';
    return '<p>'+line+'</p>';
  }).join('');
  out = out.replace(/(<li>.*?<\/li>)+/gs, m=>'<ul>'+m+'</ul>');
  // minimal LaTeX rendering fallback: wrap $...$ in <code> to be visible (katex not included in static version)
  out = out.replace(/\$(.+?)\$/g, '<code>$1</code>');
  return out;
}

function speakText(text, lang){
  if(window.speechSynthesis){
    window.speechSynthesis.cancel();
    utter = new SpeechSynthesisUtterance(text);
    utter.lang = (lang === 'hi' ? 'hi-IN' : 'en-IN');
    utter.rate = 0.95; utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v=>v.lang.startsWith(lang==='hi'?'hi':'en')) || voices[0];
    if(v) utter.voice = v;
    window.speechSynthesis.speak(utter);
  }
}

document.getElementById('stopSpeech').addEventListener('click', ()=> {
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  if(controller) controller.abort();
});

document.getElementById('copyBtn').addEventListener('click', ()=>{
  const t = document.getElementById('responseArea').innerText;
  navigator.clipboard.writeText(t).then(()=> alert('Copied to clipboard'));
});

document.getElementById('enterBtn').addEventListener('click', ()=> {
  const s = document.getElementById('splash');
  s.style.pointerEvents='none'; s.style.opacity='0'; setTimeout(()=> s.remove(),900);
});

// Escape handling
window.addEventListener('keydown', (e)=> { if(e.key === 'Escape'){ if(window.speechSynthesis) window.speechSynthesis.cancel(); if(controller) controller.abort(); }});
