// app.js — frontend logic with animation hooks
const API_BASE = 'https://sara-ai-backend.onrender.com'; // change if needed

/* ---------- syllabus (unchanged) ---------- */
const syllabus = {
  "Theory of structures": { desc: "Direct and bending stresses, slope & deflection, fixed & continuous beams, columns, moment distribution.", units: [ /* ... */ ] },
  "Building Planning and Drawing with AutoCAD": { desc: "Conventions & symbols, building planning, load bearing & framed drawing, perspective, CAD commands.", units: [ /* ... */ ] },
  "Soil Mechanics and Foundation": { desc: "Soil properties, permeability, compaction, shear strength, stabilization & bearing capacity.", units: [ /* ... */ ] },
  "Transportation Engineering": { desc: "Highway engineering, geometric design, materials & construction, basics of railway engineering.", units: [ /* ... */ ] },
  "Advance Surveying": { desc: "Plane table, theodolite, tacheometry, total station, remote sensing, GPS & GIS.", units: [ /* ... */ ] }
};

// NOTE: I've truncated unit arrays above to keep file short here — keep the full syllabus content you already have.
// If you copy/paste, restore the full syllabus units/topics objects (identical to previous app.js).

/* ---------- DOM refs ---------- */
const subjectsGrid = document.getElementById('subjectsGrid');
const home = document.getElementById('home');
const unitsView = document.getElementById('units');
const topicsView = document.getElementById('topics');
const breadcrumb = document.getElementById('breadcrumb');
const responseArea = document.getElementById('responseArea');
const langModal = document.getElementById('langModal');
const modalCard = document.querySelector('.modalCard');

let currentSubject = null, currentUnit = null, currentTopic = null;
let controller = null, utter = null;

/* ---------- Entry animation control ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Particle background (lightweight) ---------- */
(function initParticles(){
  const canvas = document.getElementById('bgParticles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const particles = Array.from({length: 28}, ()=>{
    return {
      x: Math.random()*w, y: Math.random()*h,
      r: 8 + Math.random()*36,
      vx: (Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25,
      hue: 180 + Math.random()*140, alpha: 0.03 + Math.random()*0.06
    };
  });
  function resize(){ w = canvas.width = innerWidth; h = canvas.height = innerHeight;}
  window.addEventListener('resize', resize);
  function draw(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy;
      if(p.x> w+p.r) p.x = -p.r;
      if(p.x < -p.r) p.x = w+p.r;
      if(p.y> h+p.r) p.y = -p.r;
      if(p.y < -p.r) p.y = h+p.r;
      const g = ctx.createRadialGradient(p.x,p.y,p.r*0.05,p.x,p.y,p.r);
      g.addColorStop(0, `hsla(${p.hue},80%,70%,${p.alpha})`);
      g.addColorStop(1, `hsla(${p.hue},70%,50%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  if(!prefersReduced) draw();
})();

/* ---------- Populate subjects with animation hooks ---------- */
function buildSubjects(){
  subjectsGrid.innerHTML = '';
  const keys = Object.keys(syllabus);
  keys.forEach((subj, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-subject', subj);
    card.innerHTML = `
      <div class="title">${subj}</div>
      <div class="meta">${syllabus[subj].desc}</div>
      <div class="shine"></div>
    `;
    // hover tilt effect
    card.addEventListener('pointermove', e => tiltCard(e, card));
    card.addEventListener('pointerleave', ()=> resetTilt(card));
    // ripple on click
    card.addEventListener('click', (ev)=>{
      ripple(ev, card);
      openSubject(subj);
    });
    subjectsGrid.appendChild(card);

    // staggered entrance
    if(!prefersReduced){
      card.style.opacity = 0;
      card.style.transform = 'translateY(18px) scale(.99)';
      setTimeout(()=> card.classList.add('fade-in-up'), 80*i);
      setTimeout(()=> { card.style.opacity=''; card.style.transform=''; }, 80*i + 420);
    }
  });
}

/* tilt helpers */
function tiltCard(e, el){
  const rect = el.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const rx = (py - 0.5) * -8; // rotateX
  const ry = (px - 0.5) * 10; // rotateY
  el.style.setProperty('--rx', `${rx}deg`);
  el.style.setProperty('--ry', `${ry}deg`);
}
function resetTilt(el){
  el.style.setProperty('--rx', `0deg`);
  el.style.setProperty('--ry', `0deg`);
}

/* ripple effect */
function ripple(ev, el){
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = size + 'px';
  r.style.left = (ev.clientX - rect.left - size/2) + 'px';
  r.style.top = (ev.clientY - rect.top - size/2) + 'px';
  el.appendChild(r);
  setTimeout(()=> r.remove(), 600);
}

/* ---------- Views & navigation (unchanged behavior) ---------- */
function showView(v){
  home.classList.add('hidden'); unitsView.classList.add('hidden'); topicsView.classList.add('hidden');
  if(v==='home') home.classList.remove('hidden');
  if(v==='units') unitsView.classList.remove('hidden');
  if(v==='topics') topicsView.classList.remove('hidden');
  breadcrumb.textContent = v==='home'?'Home':(v==='units'?currentSubject:'Topics');
}

document.getElementById('backToSubjects').onclick = ()=> {
  showView('home');
  // animate subjects in again
  animateChildrenIn(subjectsGrid);
};
document.getElementById('backToUnits').onclick = ()=> {
  showView('units');
};
document.getElementById('restart').onclick = ()=> location.reload();

/* ---------- openSubject / openUnit with entrances ---------- */
function openSubject(subj){
  currentSubject = subj;
  document.getElementById('subjectTitle').textContent = subj;
  document.getElementById('subjectDesc').textContent = syllabus[subj].desc;
  const list = document.getElementById('unitsList'); list.innerHTML = '';
  syllabus[subj].units.forEach((u,idx)=>{
    const c=document.createElement('div'); c.className='unitCard';
    c.innerHTML=`<strong>${u.title}</strong><div style='opacity:.8;margin-top:6px;font-size:13px'>${u.topics.slice(0,3).join(' • ')}</div>`;
    c.addEventListener('click', ()=> {
      ripple(event, c);
      openUnit(idx);
    });
    list.appendChild(c);
    if(!prefersReduced){
      c.style.opacity = 0; c.style.transform='translateY(18px)';
      setTimeout(()=>{ c.classList.add('fade-in-up'); c.style.opacity=''; c.style.transform=''; }, 60*idx + 80);
    }
  });
  showView('units');
}

function openUnit(idx){
  currentUnit = syllabus[currentSubject].units[idx];
  document.getElementById('unitTitle').textContent = currentUnit.title;
  document.getElementById('unitDesc').textContent = currentUnit.topics.join(', ');
  const tlist = document.getElementById('topicList'); tlist.innerHTML = '';
  currentUnit.topics.forEach((t,i)=>{
    const el = document.createElement('div'); el.className='topic'; el.textContent = t;
    el.addEventListener('click', ()=> { ripple(event, el); selectTopic(t); });
    tlist.appendChild(el);
    if(!prefersReduced){
      el.style.opacity=0; el.style.transform='translateY(10px)';
      setTimeout(()=>{ el.classList.add('fade-in-up'); el.style.opacity=''; el.style.transform=''; }, 40*i + 60);
    }
  });
  showView('topics');
}

/* ---------- language modal ---------- */
let chosenLang = 'en';
document.getElementById('askLanguageBtn').addEventListener('click', ()=> {
  showModal();
});
langModal.querySelectorAll('button[data-lang]').forEach(b=>b.addEventListener('click', ()=>{
  chosenLang = b.dataset.lang;
  hideModal();
  runChatRequest(currentTopic, chosenLang);
}));

function showModal(){
  langModal.classList.remove('hidden');
  setTimeout(()=> modalCard.classList.add('show'), 20);
}
function hideModal(){
  modalCard.classList.remove('show');
  setTimeout(()=> langModal.classList.add('hidden'), 260);
}

/* ---------- main chat request (unchanged but robust) ---------- */
async function runChatRequest(topic, lang){
  if(!topic) return alert('No topic selected');
  responseArea.innerHTML = `<em>Requesting explanation for <strong>${topic}</strong> (language: ${lang==='hi'?'Hindi':'English'}) ...</em>`;

  const prompt = `You are a clear college-level teacher. Explain the topic "${topic}" from the subject ${currentSubject}.\nGive:\n1) A short definition.\n2) Step-by-step explanation with numbered steps.\n3) Key formulas using LaTeX (denote formulas with $...$).\n4) One worked example (simple).\n5) A short summary.\nUse emojis where helpful. Format with headings, **bold** for important terms, *italic* for notes.\nWrite the whole answer in ${lang==='hi' ? 'Hindi' : 'English'}.`;

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
      const errText = await res.text().catch(()=>res.statusText);
      throw new Error(`Server ${res.status}: ${errText}`);
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

/* ---------- Formatting / LaTeX (same as before) ---------- */
function renderFormatting(txt){
  if(!txt) return '<p>No content</p>';
  let work = escapeHtml(txt);
  work = work.replace(/\$(.+?)\$/gs, (m, expr) => {
    const rawExpr = unescapeHtml(expr);
    if(window.katex && typeof window.katex.renderToString === 'function'){
      try { return window.katex.renderToString(rawExpr, { throwOnError: false }); }
      catch (e) { return `<code>${escapeHtml(rawExpr)}</code>`; }
    } else {
      return `<code>${escapeHtml(rawExpr)}</code>`;
    }
  });
  work = work.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  work = work.replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = work.split(/\r?\n/);
  let out=''; let inList=false;
  lines.forEach(line=>{
    if(/^\s*[-*]\s+/.test(line)){ if(!inList){ out+='<ul>'; inList=true;} out+=`<li>${line.replace(/^\s*[-*]\s+/,'')}</li>`; }
    else if(/^\s*\d+\.\s+/.test(line)){ if(!inList){ out+='<ul>'; inList=true;} out+=`<li>${line.replace(/^\s*\d+\.\s+/,'')}</li>`; }
    else { if(inList){ out+='</ul>'; inList=false; } out += line.trim()===''? '<br/>':`<p>${line}</p>`; }
  });
  if(inList) out += '</ul>';
  return out;
}

/* ---------- TTS ---------- */
function speakText(text, lang){
  if(!window.speechSynthesis) return;
  try { window.speechSynthesis.cancel(); } catch(e){}
  const plain = text.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s{2,}/g,' ').trim();
  utter = new SpeechSynthesisUtterance(plain);
  utter.lang = (lang === 'hi' ? 'hi-IN' : 'en-IN');
  utter.rate = 0.95; utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  if(voices && voices.length){
    const v = voices.find(v=>v.lang.toLowerCase().startsWith(utter.lang.split('-')[0])) || voices[0];
    if(v) utter.voice = v;
  }
  window.speechSynthesis.speak(utter);
}

/* stop / copy / enter handlers */
document.getElementById('stopSpeech').addEventListener('click', ()=> { if(window.speechSynthesis) window.speechSynthesis.cancel(); if(controller) controller.abort(); });
document.getElementById('copyBtn').addEventListener('click', ()=> { navigator.clipboard.writeText(responseArea.innerText).then(()=> alert('Copied')).catch(()=> alert('Unable to copy')); });
document.getElementById('enterBtn').addEventListener('click', ()=> {
  const s = document.getElementById('splash');
  s.style.pointerEvents='none'; s.style.opacity='0';
  // reveal subjects after curtain animation completes
  setTimeout(()=> { s.remove(); buildSubjects(); }, 900);
});

/* ESC abort */
window.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ if(window.speechSynthesis) window.speechSynthesis.cancel(); if(controller) controller.abort(); } });

/* ---------- small helpers ---------- */
function escapeHtml(unsafe){ if(unsafe===null||unsafe===undefined) return ''; return String(unsafe).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }
function unescapeHtml(s){ return String(s).replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#039;',"'"); }

/* animate children in (stagger) */
function animateChildrenIn(container){
  const children = Array.from(container.children);
  children.forEach((ch,i)=>{
    ch.style.opacity=0; ch.style.transform='translateY(14px)';
    setTimeout(()=> { ch.classList.add('fade-in-up'); ch.style.opacity=''; ch.style.transform=''; }, i*60);
  });
}

/* initialize (if user refreshed while inside, build subjects) */
document.addEventListener('DOMContentLoaded', ()=>{
  // If splash still exists, do nothing until enter is clicked.
  if(!document.getElementById('splash')) buildSubjects();
});
