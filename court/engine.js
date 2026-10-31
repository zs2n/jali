/* جَلِيّ — Mock court engine. Loaded on demand by index.html (window.openCourt stub).
   Game flow and case logic are carried over from the original inline version; the art,
   interface and transitions are new (Stage B). */
(function(){
  'use strict';
  if(window.JaliCourtReady) return;
  var ART = window.JaliCourtArt, DATA = window.JaliCourtCases;
  if(!ART || !DATA) return;
  var host = document.createElement('div');
  host.innerHTML = "<div id=\"court\" hidden role=\"dialog\" aria-modal=\"true\" aria-label=\"محكمة جَلِيّ\">\n<div class=\"cwrap\" dir=\"rtl\" lang=\"ar\">\n  <div class=\"hud\">\n    <div class=\"title\"><button class=\"pbtn\" id=\"c-exit\" type=\"button\">خروج</button><span class=\"logo\">محكمة <span>جَلِيّ</span></span> <small id=\"c-caseTitle\"></small></div>\n    <div class=\"hud-r\">\n      <div class=\"trust\" aria-label=\"ثقة المحكمة\"><span>ثقة المحكمة</span><span id=\"c-trust\"></span></div>\n      <button class=\"pbtn\" id=\"c-recBtn\" type=\"button\">المستندات</button>\n      <button class=\"pbtn\" id=\"c-casesBtn\" type=\"button\">القضايا</button>\n      <button class=\"pbtn\" id=\"c-sndBtn\" type=\"button\" aria-pressed=\"true\"><span data-s=\"on\">الصوت: مفتوح</span><span data-s=\"off\" hidden>الصوت: مغلق</span></button>\n    </div>\n  </div>\n  <div class=\"stage\" id=\"c-stage\">\n    <canvas id=\"c-cv\" width=\"480\" height=\"270\" aria-label=\"قاعة المحكمة\"></canvas>\n    <div class=\"flash\" id=\"c-flash\"></div>\n    <div class=\"objection\" id=\"c-obj\" hidden><b>اعتراض!</b></div>\n    <div class=\"banner\" id=\"c-banner\" hidden><small id=\"c-bannerSub\"></small><b id=\"c-bannerTitle\"></b></div>\n  </div>\n  <div class=\"box\" id=\"c-box\" tabindex=\"0\" aria-live=\"polite\">\n    <div class=\"plate\"><canvas class=\"face\" id=\"c-face\" width=\"28\" height=\"28\" aria-hidden=\"true\" hidden></canvas><span class=\"name\" id=\"c-name\">جَلِيّ</span></div>\n    <p class=\"text\" id=\"c-text\">اختر قضية لتبدأ الجلسة.</p>\n    <div class=\"ctrl\" id=\"c-crossCtrl\" hidden>\n      <button class=\"pbtn\" id=\"c-prevBtn\" type=\"button\">السابق</button>\n      <button class=\"pbtn\" id=\"c-nextBtn\" type=\"button\">التالي</button>\n      <span class=\"sp\"></span>\n      <button class=\"pbtn red\" id=\"c-objBtn\" type=\"button\">اعتراض بمستند</button>\n    </div>\n    <div class=\"choices\" id=\"c-choices\" hidden></div>\n    <span class=\"more\" id=\"c-more\" hidden>▼</span>\n  </div>\n  <p class=\"foot\">محاكاة تعليمية مبسّطة لقضايا عمالية متخيَّلة. الإجراءات الفعلية أمام المحاكم تختلف، والشخصيات والأسماء من وحي الخيال.</p>\n</div>\n<div class=\"modal\" id=\"c-startModal\">\n  <div class=\"sheet start\">\n    <span class=\"crest\" aria-hidden=\"true\"></span>\n    <h1>محكمة <span>جَلِيّ</span></h1>\n    <p>أنت المحامي فيصل. اختر قضية، واقرأ مستنداتك، واعترض على كل إفادة كاذبة، ثم اطلب لموكلك حقه كاملاً وفق نظام العمل.</p>\n    <div class=\"cases\" id=\"c-caseList\"></div>\n  </div>\n</div>\n<div class=\"modal\" id=\"c-introModal\" hidden>\n  <div class=\"sheet intro\">\n    <span class=\"kicker\" id=\"c-introNo\"></span>\n    <canvas class=\"pic\" id=\"c-introPic\" width=\"72\" height=\"72\" aria-hidden=\"true\"></canvas>\n    <h2 id=\"c-introTitle\"></h2>\n    <small id=\"c-introSub\"></small>\n    <p id=\"c-introText\"></p>\n    <button class=\"pbtn gold\" id=\"c-introGo\" type=\"button\">ابدأ القضية</button>\n  </div>\n</div>\n<div class=\"modal\" id=\"c-recModal\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"c-recTitle\">\n    <h2 id=\"c-recTitle\">المستندات</h2>\n    <p class=\"empty\" id=\"c-recHint\">اختر المستند الذي يناقض العبارة.</p>\n    <div id=\"c-recList\" class=\"rec-list\"></div>\n    <button class=\"pbtn\" id=\"c-recClose\" type=\"button\">إغلاق</button>\n  </div>\n</div>\n<div class=\"modal\" id=\"c-endModal\" hidden>\n  <div class=\"sheet start c-verdict\">\n    <span class=\"c-seal\" aria-hidden=\"true\"></span>\n    <h1 id=\"c-endTitle\"></h1>\n    <div id=\"c-endBody\" class=\"end-body\"></div>\n    <div class=\"end-btns\">\n      <button class=\"pbtn gold\" id=\"c-nextCaseBtn\" type=\"button\">القضية التالية</button>\n      <button class=\"pbtn\" id=\"c-againBtn\" type=\"button\">أعد القضية</button>\n      <button class=\"pbtn\" id=\"c-listBtn\" type=\"button\">كل القضايا</button>\n    </div>\n  </div>\n</div>\n</div>";
  document.body.appendChild(host.firstChild);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var cv = $('c-cv'), C = cv.getContext('2d'); C.imageSmoothingEnabled = false;
  var snap = document.createElement('canvas'); snap.width = ART.W; snap.height = ART.H;
  var snapC = snap.getContext('2d'); snapC.imageSmoothingEnabled = false;
  var shownView = '', transAt = -1, sessionShown = false;
  var CHARS = DATA.CHARS, CLIENTS = DATA.CLIENTS, CASES = DATA.CASES;
  var gavelT = -1, client = 'salem';


  /* ---------------- state ---------------- */
  var view = 'lobby', st = {expr:'worried', pose:null, dir:1, mouth:false, blink:false, breath:false};
  var cur = null, S = [], EVID = {};
  var i = 0, trust = 5, record = [], mode = 'idle', speaker = null;
  var typing = null, full = '', crossIdx = 0, crossStep = null, mistakes = 0;
  var done = {};
  try{ done = JSON.parse(localStorage.getItem('jali-court-done') || '{}') || {}; }catch(e){ done = {}; }

  /* ---------------- sound ---------------- */
  var audio = null, soundOn = true;
  function ac(){ if(!audio){ try{ audio = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audio = null; } } if(audio && audio.state==='suspended') audio.resume(); return audio; }
  function beep(freq, len, type, vol){
    if(!soundOn || !audio) return;
    var t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
    o.type = type||'square'; o.frequency.value = freq; g.gain.setValueAtTime(vol||0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t+len);
    o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t+len+0.02);
  }
  var VOICE = {player:520, rival:380, judge:260, client:640, note:880};
  $('c-sndBtn').addEventListener('click', function(){
    soundOn = !soundOn; this.setAttribute('aria-pressed', String(soundOn));
    Array.prototype.forEach.call(this.querySelectorAll('[data-s]'), function(s){ s.hidden = (s.dataset.s==='on') !== soundOn; });
    if(soundOn) ac();
  });

  /* ---------------- rendering ---------------- */
  var visible = true, last = 0, blinkAt = 2000, raf = 0;
  function charOf(who){ return who==='client' ? CLIENTS[client] : CHARS[who]; }
  function frame(now){
    if(!visible){ raf = 0; return; }
    var ch = speaker ? charOf(speaker) : null;
    var talking = typing && ch && ch.view === view;
    st.mouth = !!talking && Math.floor(now/95)%2===0;
    st.breath = !reduce && Math.floor(now/900)%2===0;
    if(now > blinkAt){ st.blink = true; if(now > blinkAt+120){ st.blink=false; blinkAt = now + 2200 + Math.random()*2400; } }
    if(gavelT>=0){ gavelT += (now-last)/1000; if(gavelT>0.7) gavelT=-1; }
    last = now;
    if(view !== shownView){
      if(shownView && !reduce){ snapC.drawImage(cv, 0, 0); transAt = now; }
      shownView = view;
    }
    var shown = st;
    if(speaker && st.expr==='normal' && !st.pose){ var sc = charOf(speaker); if(!sc || sc.view !== view) shown = {expr:'listen', pose:null, dir:st.dir, mouth:false, blink:st.blink, breath:st.breath}; }
    C.save();
    var bob = talking && !reduce ? (Math.floor(now/190)%2) : 0;
    C.translate(0, bob);
    ART.scene(C, view, {st:shown, gavelT:gavelT, now:now, cast:{client:cur ? client : null, witness:null}});
    C.restore();
    if(transAt >= 0){
      var p = Math.floor(Math.min(1, (now - transAt)/260) * 6) / 6;
      if(p >= 1) transAt = -1;
      else for(var by=0; by<ART.H; by+=18){ var hgt = Math.round(18*(1-p)); if(hgt>0) C.drawImage(snap, 0, by, ART.W, hgt, 0, by, ART.W, hgt); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; if(visible && !raf) raf = requestAnimationFrame(frame); }); }).observe(cv);
  }

  /* ---------------- dialogue ---------------- */
  var faceEl = $('c-face'), nameEl = $('c-name'), textEl = $('c-text'), moreEl = $('c-more'), crossCtrl = $('c-crossCtrl'), choicesEl = $('c-choices');
  function setName(who, override){
    var ch = charOf(who);
    nameEl.className = 'name ' + (who==='note' ? 'n-note' : ch ? ch.tag : '');
    nameEl.textContent = override || (ch ? ch.name : '');
    var pid = who==='client' ? client : who;
    faceEl.hidden = !ART.CAST[pid];
    if(ART.CAST[pid] && faceEl.dataset.id !== pid){ ART.portrait(faceEl, pid, 'normal'); faceEl.dataset.id = pid; }
  }
  function type(who, text, done, cls){
    speaker = who; full = text; textEl.textContent = ''; textEl.className = 'text' + (cls ? ' '+cls : '');
    moreEl.hidden = true;
    clearInterval(typing);
    if(reduce){ textEl.textContent = full; typing = null; if(done) done(); else moreEl.hidden = false; return; }
    var shown = 0;
    typing = setInterval(function(){
      shown++; textEl.textContent = full.slice(0, shown);
      if(shown % 2 === 0 && full.charAt(shown-1) !== ' ') beep((VOICE[who]||500) + (shown%3)*20, 0.04, 'square', 0.035);
      if(shown >= full.length){ clearInterval(typing); typing = null; if(done) done(); else moreEl.hidden = false; }
    }, 26);
  }
  function finishTyping(){ if(typing){ clearInterval(typing); typing = null; textEl.textContent = full; if(mode==='say') moreEl.hidden = false; return true; } return false; }

  function renderTrust(){
    var t = $('c-trust'); t.textContent = '';
    for(var k=0;k<5;k++){ var d = document.createElement('i'); if(k>=trust) d.className='off'; t.appendChild(d); }
  }
  function hurt(){
    trust--; renderTrust(); mistakes++;
    var s = $('c-stage'); s.classList.remove('shake'); void s.offsetWidth; if(!reduce) s.classList.add('shake');
    beep(140, 0.25, 'sawtooth', 0.06);
    if(trust<=0){ setTimeout(lose, 600); return true; }
    return false;
  }

  function next(){
    while(i < S.length){
      var s = S[i];
      if(s.scene && view==='lobby' && s.scene!=='lobby' && !sessionShown){ sessionShown = true; establish(); return; }
      if(s.scene){ view = s.scene; st.expr = s.expr||'normal'; st.pose = s.pose||null; st.dir = s.dir||1; i++; continue; }
      if(s.say){ if(s.expr) st.expr = s.expr; mode='say'; setName(s.say); type(s.say, s.text); i++; return; }
      if(s.add){ record.push(s.add); mode='say'; setName('note','أُضيف إلى المستندات'); type('note', EVID[s.add].title + ': ' + EVID[s.add].desc); beep(880,0.12,'triangle',0.06); i++; return; }
      if(s.cross){ startCross(s.cross); return; }
      if(s.choice){ startChoice(s.choice); return; }
      if(s.objection){ i++; objection(); return; }
      if(s.gavel){ i++; gavel(); return; }
      if(s.end){ win(); return; }
      i++;
    }
  }
  function advance(){
    if(mode!=='say') return;
    if(finishTyping()) return;
    ac(); next();
  }
  $('c-box').addEventListener('click', function(e){ if(e.target.closest('button')) return; advance(); });
  document.addEventListener('keydown', function(e){
    if($('court').hidden) return;
    if(!$('c-recModal').hidden || !$('c-startModal').hidden || !$('c-endModal').hidden || !$('c-introModal').hidden) return;
    if(e.key==='Enter' || e.key===' '){ if(mode==='say'){ e.preventDefault(); advance(); } }
  });

  /* ---------------- cross-examination ---------------- */
  function showCrossLine(){
    view = 'rival'; st.pose = null;
    setName('rival', 'ماجد · إفادة ' + (crossIdx+1) + ' من ' + crossStep.lines.length);
    type('rival', crossStep.lines[crossIdx], function(){}, 'cross');
  }
  function startCross(c){
    mode = 'cross'; crossStep = c; crossIdx = 0; crossCtrl.hidden = false; choicesEl.hidden = true; moreEl.hidden = true;
    st.expr = st.expr==='shock' ? 'sweat' : 'normal';
    showCrossLine();
  }
  $('c-prevBtn').addEventListener('click', function(){ if(mode!=='cross') return; finishTyping(); crossIdx = (crossIdx - 1 + crossStep.lines.length) % crossStep.lines.length; showCrossLine(); });
  $('c-nextBtn').addEventListener('click', function(){ if(mode!=='cross') return; finishTyping(); crossIdx = (crossIdx + 1) % crossStep.lines.length; showCrossLine(); });
  $('c-objBtn').addEventListener('click', function(){ if(mode!=='cross') return; finishTyping(); openRecord(true); });

  function present(ev){
    closeRecord();
    if(crossIdx === crossStep.line && ev === crossStep.ev){
      crossCtrl.hidden = true; mode = 'busy'; i++; next();
    } else {
      mode = 'busy'; crossCtrl.hidden = true;
      view = 'judge'; st.expr = 'stern';
      var msg = crossIdx !== crossStep.line ? 'هذه العبارة صحيحة، ولا يناقضها أي مستند في يدك. تنقّل بين العبارات وابحث عن العبارة الكاذبة.' : 'العبارة هي المقصودة، لكن هذا المستند لا يثبت عكسها. اختر المستند الذي يكذّبها.';
      setName('judge'); type('judge', msg, function(){
        if(hurt()) return;
        setTimeout(function(){ mode='cross'; crossCtrl.hidden=false; st.expr='normal'; showCrossLine(); }, 1400);
      });
    }
  }

  /* ---------------- choices ---------------- */
  function startChoice(c){
    mode = 'choice'; crossCtrl.hidden = true; moreEl.hidden = true;
    view = 'player'; st.expr = 'think'; st.pose = null;
    setName('note', c.prompt); textEl.textContent = ''; textEl.className='text';
    choicesEl.textContent = ''; choicesEl.hidden = false;
    c.options.forEach(function(o){
      var b = document.createElement('button'); b.type='button'; b.className='choice'; b.textContent = o.label;
      b.addEventListener('click', function(){
        if(mode!=='choice') return;
        choicesEl.hidden = true;
        if(o.ok){ beep(660,0.1,'triangle',0.06); setTimeout(function(){beep(990,0.15,'triangle',0.06);},110); mode='busy'; st.expr='normal'; i++; next(); }
        else {
          mode = 'busy'; view='judge'; st.expr='stern';
          setName('judge'); type('judge', o.why, function(){
            if(hurt()) return;
            setTimeout(function(){ st.expr='normal'; startChoice(c); }, 1600);
          });
        }
      });
      choicesEl.appendChild(b);
    });
  }

  /* ---------------- effects ---------------- */
  function objection(){
    mode = 'busy'; crossCtrl.hidden = true; moreEl.hidden = true;
    var o = $('c-obj'), f = $('c-flash'), s = $('c-stage');
    o.hidden = false; f.classList.remove('on'); void f.offsetWidth; if(!reduce) f.classList.add('on');
    s.classList.remove('shake'); void s.offsetWidth; if(!reduce) s.classList.add('shake');
    beep(220,0.18,'sawtooth',0.07); setTimeout(function(){ beep(330,0.25,'square',0.06); },120);
    setTimeout(function(){ o.hidden = true; next(); }, reduce ? 300 : 1000);
  }
  function gavel(){
    mode = 'busy'; view = 'judge'; st.expr = 'judgment'; st.pose = null;
    var hits = 0;
    (function hit(){
      gavelT = 0; beep(120,0.12,'square',0.08); beep(900,0.04,'square',0.04);
      var s = $('c-stage'); s.classList.remove('shake'); void s.offsetWidth; if(!reduce) s.classList.add('shake');
      hits++; if(hits<3) setTimeout(hit, 420); else setTimeout(function(){ st.expr = 'normal'; next(); }, 500);
    })();
  }

  /* ---------------- record ---------------- */
  var recModal = $('c-recModal'), recList = $('c-recList'), lastFocus = null;
  function openRecord(presenting){
    lastFocus = document.activeElement;
    $('c-recHint').hidden = !presenting; recList.textContent = '';
    if(!record.length){ var p = document.createElement('p'); p.className='empty'; p.textContent='لا توجد مستندات بعد.'; recList.appendChild(p); }
    record.forEach(function(id){
      var e = EVID[id], card = document.createElement('div'); card.className='ev';
      var ic = document.createElement('canvas'); ic.width=40; ic.height=50; ic.setAttribute('aria-hidden','true'); ART.doc(ic, id); card.appendChild(ic);
      var body = document.createElement('div'), h = document.createElement('h3'), p = document.createElement('p');
      h.textContent = e.title; p.textContent = e.desc; body.appendChild(h); body.appendChild(p);
      if(presenting){ var b = document.createElement('button'); b.type='button'; b.className='pbtn gold'; b.textContent='قدّم هذا المستند'; b.addEventListener('click', function(){ present(id); }); body.appendChild(b); }
      card.appendChild(body); recList.appendChild(card);
    });
    recModal.hidden = false; $('c-recClose').focus();
  }
  function closeRecord(){ recModal.hidden = true; if(lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('c-recBtn').addEventListener('click', function(){ openRecord(false); });
  $('c-recClose').addEventListener('click', closeRecord);
  recModal.addEventListener('click', function(e){ if(e.target===recModal) closeRecord(); });
  document.addEventListener('keydown', function(e){ if($('court').hidden || e.key!=='Escape') return; if(!recModal.hidden) closeRecord(); else closeCourt(); });

  /* ---------------- case select / start / end ---------------- */
  var caseList = $('c-caseList');
  function buildCaseList(){
    caseList.textContent = '';
    CASES.forEach(function(c, n){
      var b = document.createElement('button'); b.type='button'; b.className='case';
      var no = document.createElement('span'); no.className='no'; no.textContent = String(n+1);
      var pic = document.createElement('canvas'); pic.className='pic'; pic.width=40; pic.height=40; pic.setAttribute('aria-hidden','true'); ART.portrait(pic, c.client, 'worried');
      var mid = document.createElement('span'); var t = document.createElement('b'); t.textContent = c.title;
      var s1 = document.createElement('small'); s1.textContent = c.sub + ' · ' + c.arts;
      var s2 = document.createElement('small'); s2.textContent = c.intro;
      mid.appendChild(t); mid.appendChild(s1); mid.appendChild(s2);
      var badge = document.createElement('span'); badge.className = 'badge ' + (done[c.id] ? 'done' : 'new'); badge.textContent = done[c.id] ? 'كسبتها' : 'جديدة';
      b.appendChild(no); b.appendChild(pic); b.appendChild(mid); b.appendChild(badge);
      b.addEventListener('click', function(){ ac(); startCase(n); });
      caseList.appendChild(b);
    });
  }
  function showCases(){ buildCaseList(); $('c-endModal').hidden = true; $('c-startModal').hidden = false; var f = caseList.querySelector('button'); if(f) f.focus(); }
  var curIdx = 0;
  function startCase(n){
    curIdx = n; cur = CASES[n]; S = cur.script; EVID = cur.evid; client = cur.client;
    i = 0; trust = 5; record = []; mistakes = 0; view='lobby'; st = {expr:'worried', pose:null, dir:1, mouth:false, blink:false, breath:false};
    crossCtrl.hidden = true; choicesEl.hidden = true; renderTrust();
    $('c-caseTitle').textContent = '· ' + cur.title;
    $('c-startModal').hidden = true; $('c-endModal').hidden = true;
    sessionShown = false; mode = 'intro'; view = 'wide';
    $('c-introNo').textContent = 'القضية ' + (n+1) + ' من ' + CASES.length;
    $('c-introTitle').textContent = cur.title; $('c-introSub').textContent = cur.sub + ' · ' + cur.arts; $('c-introText').textContent = cur.intro;
    ART.portrait($('c-introPic'), cur.client, 'worried');
    $('c-introModal').hidden = false; $('c-introGo').focus();
  }
  function para(t, strong){ var p = document.createElement('p'); p.style.margin='0'; if(strong){ p.style.color='var(--gold)'; p.style.fontWeight='700'; } p.textContent = t; return p; }
  function win(){
    mode='end'; done[cur.id] = true;
    try{ localStorage.setItem('jali-court-done', JSON.stringify(done)); }catch(e){}
    var b = $('c-endBody'); b.textContent='';
    $('c-endTitle').textContent = 'كسبت القضية';
    b.appendChild(para((CLIENTS[cur.client].f ? 'حصلت ' : 'حصل ') + CLIENTS[cur.client].name + ' على ' + cur.total + ' ريال' + (mistakes ? '، بعد ' + mistakes + ' أخطاء.' : ' دون أي خطأ.'), true));
    cur.summary.forEach(function(t){ b.appendChild(para(t)); });
    var remaining = CASES.filter(function(c){ return !done[c.id]; }).length;
    if(!remaining) b.appendChild(para('كسبت كل القضايا. أحسنت يا أستاذ فيصل!', true));
    $('c-nextCaseBtn').hidden = curIdx >= CASES.length - 1;
    $('c-endModal').hidden = false; ($('c-nextCaseBtn').hidden ? $('c-listBtn') : $('c-nextCaseBtn')).focus();
  }
  function lose(){
    mode='end'; var b = $('c-endBody'); b.textContent='';
    $('c-endTitle').textContent = 'فقدت ثقة المحكمة';
    b.appendChild(para('لا بأس، المحامي الجيد يتعلم من الجلسة. راجع موضوع «نهاية الخدمة» في جَلِيّ ثم حاول مرة أخرى.'));
    $('c-nextCaseBtn').hidden = true;
    $('c-endModal').hidden = false; $('c-againBtn').focus();
  }
  $('c-againBtn').addEventListener('click', function(){ startCase(curIdx); });
  $('c-nextCaseBtn').addEventListener('click', function(){ startCase(curIdx + 1); });
  $('c-listBtn').addEventListener('click', showCases);
  $('c-casesBtn').addEventListener('click', function(){ if(typing){ clearInterval(typing); typing=null; } crossCtrl.hidden = true; choicesEl.hidden = true; $('c-introModal').hidden = true; mode = 'idle'; showCases(); });
  buildCaseList();
  renderTrust();
  /* ---- open / close inside the site ---- */
  var opener = null;
  window.openCourt = function(btn){
    opener = btn || null;
    $('court').hidden = false; document.body.style.overflow = 'hidden';
    if(!$('c-startModal').hidden){ buildCaseList(); var f = caseList.querySelector('button'); if(f) f.focus(); } else $('c-box').focus({preventScroll:true});
  };
  function closeCourt(){
    $('court').hidden = true; document.body.style.overflow = '';
    if(typing){ clearInterval(typing); typing = null; textEl.textContent = full; } if(mode==='say') moreEl.hidden = false;
    if(opener && opener.focus) opener.focus();
  }
  $('c-exit').addEventListener('click', closeCourt);

  /* ---------------- new: establishing shot and case intro ---------------- */
  function establish(){
    mode = 'busy'; view = 'wide'; moreEl.hidden = true;
    $('c-bannerSub').textContent = cur.title; $('c-bannerTitle').textContent = 'تُفتح الجلسة';
    var bn = $('c-banner'); bn.hidden = false;
    beep(196,0.25,'triangle',0.05); setTimeout(function(){ beep(262,0.3,'triangle',0.05); }, 180);
    setTimeout(function(){ bn.hidden = true; next(); }, reduce ? 700 : 1500);
  }
  $('c-introGo').addEventListener('click', function(){
    ac(); $('c-introModal').hidden = true; view = 'lobby'; mode = 'busy'; next(); $('c-box').focus({preventScroll:true});
  });
  view = 'wide';
  /* the character sheet image loads asynchronously: refresh portraits once it is ready */
  if(ART.onReady) ART.onReady(function(){ buildCaseList(); faceEl.dataset.id = ''; });
  window.JaliCourtReady = true;
})();
