// ===================== STATE =====================
let selectedRisk = 2;
let selectedInstr = 'GC';
let selectedDir = 'BUY';
let selectedRR = 1;

const POINT_VALUE = { GC: 100, MGC: 10 };
const STORAGE_KEY = 'futuresJournalEntries_v2';
const SETTINGS_KEY = 'futuresCalcSettings_v1';
const RR_PRESETS = [1, 1.5, 2, 3, 4];

// ===================== THEME =====================
function initTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').textContent = saved === 'dark' ? '🌙' : '☀️';
}
document.getElementById('themeToggle').addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
}); 
initTheme();

// ===================== TABS =====================
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    ['calc','journal','stats','risk','specs'].forEach(name=>{
      document.getElementById('tab-'+name).classList.toggle('hidden', name!==t.dataset.tab);
    });
    if(t.dataset.tab==='journal') renderJournal();
    if(t.dataset.tab==='stats') renderStats();
    if(t.dataset.tab==='risk') renderRiskGuard();
  });
});

// ===================== RISK PILLS =====================
document.querySelectorAll('#riskPills .pill').forEach(p=>{
  p.addEventListener('click', ()=>{
    document.querySelectorAll('#riskPills .pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    selectedRisk = parseFloat(p.dataset.risk);
    document.getElementById('customRisk').value='';
    calculate();
  });
});
document.getElementById('customRisk').addEventListener('input', (e)=>{
  if(e.target.value !== ''){
    document.querySelectorAll('#riskPills .pill').forEach(x=>x.classList.remove('active'));
    selectedRisk = parseFloat(e.target.value)||0;
  } else {
    selectedRisk = parseFloat(document.querySelector('#riskPills .pill.active')?.dataset.risk || 2);
  }
  calculate();
});

// ===================== INSTRUMENT =====================
document.getElementById('pillGC').addEventListener('click', ()=>{
  selectedInstr='GC';
  document.getElementById('pillGC').classList.add('active');
  document.getElementById('pillMGC').classList.remove('active');
  calculate();
});
document.getElementById('pillMGC').addEventListener('click', ()=>{
  selectedInstr='MGC';
  document.getElementById('pillMGC').classList.add('active');
  document.getElementById('pillGC').classList.remove('active');
  calculate();
});

// ===================== DIRECTION =====================
document.getElementById('optBuy').addEventListener('click', ()=>{
  selectedDir='BUY';
  document.getElementById('optBuy').classList.add('active');
  document.getElementById('optSell').classList.remove('active');
  calculate();
});
document.getElementById('optSell').addEventListener('click', ()=>{
  selectedDir='SELL';
  document.getElementById('optSell').classList.add('active');
  document.getElementById('optBuy').classList.remove('active');
  calculate();
});

// ===================== RR PILLS =====================
document.querySelectorAll('.rr-group .pill').forEach(p=>{
  p.addEventListener('click', ()=>{
    document.querySelectorAll('.rr-group .pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    selectedRR = parseFloat(p.dataset.rr);
    calculate();
  });
});

// ===================== PARTIAL EXIT TOGGLE =====================
document.getElementById('partialMode').addEventListener('change', (e)=>{
  document.getElementById('partialFields').classList.toggle('hidden', !e.target.checked);
  document.getElementById('partialResults').classList.toggle('hidden', !e.target.checked);
  calculate();
});
['rr1','rr1pct','rr2','rr2pct'].forEach(id=>{
  document.getElementById(id).addEventListener('input', calculate);
});

// ===================== GENERAL INPUTS =====================
['capital','entry','stop','fees'].forEach(id=>{
  document.getElementById(id).addEventListener('input', calculate);
});

// ===================== CALCULATION =====================
function calculate(){
  const capital = parseFloat(document.getElementById('capital').value) || 0;
  const entry = parseFloat(document.getElementById('entry').value);
  const stop = parseFloat(document.getElementById('stop').value);
  const fees = parseFloat(document.getElementById('fees').value) || 0;
  const ptVal = POINT_VALUE[selectedInstr];

  const riskAmt = capital * (selectedRisk/100);
  document.getElementById('outRiskAmt').textContent = '$'+riskAmt.toFixed(2);
  document.getElementById('outPtVal').textContent = '$'+ptVal.toFixed(2);

  const rrTableBody = document.querySelector('#rrTable tbody');

  if(isNaN(entry) || isNaN(stop) || entry===stop){
    document.getElementById('outLots').textContent='0.00';
    document.getElementById('outStopDist').textContent='0.00 pts';
    document.getElementById('outTarget').textContent='-';
    document.getElementById('outTargetDist').textContent='0.00 pts';
    document.getElementById('outLoss').textContent='$0.00';
    document.getElementById('outProfit').textContent='$0.00';
    document.getElementById('outBE').textContent='0.00 pts';
    rrTableBody.innerHTML = '';
    return;
  }

  const stopDist = Math.abs(entry - stop);
  document.getElementById('outStopDist').textContent = stopDist.toFixed(2)+' pts';

  const lots = riskAmt / (stopDist * ptVal);
  document.getElementById('outLots').textContent = lots.toFixed(2);

  const targetDist = stopDist * selectedRR;
  const targetPrice = selectedDir === 'BUY' ? entry + targetDist : entry - targetDist;
  document.getElementById('outTarget').textContent = targetPrice.toFixed(2);
  document.getElementById('outTargetDist').textContent = targetDist.toFixed(2)+' pts';

  const loss = stopDist * ptVal * lots + fees*Math.max(lots,0);
  const profit = targetDist * ptVal * lots - fees*Math.max(lots,0);
  document.getElementById('outLoss').textContent = '$'+loss.toFixed(2);
  document.getElementById('outProfit').textContent = '$'+profit.toFixed(2);

  // breakeven move needed to cover fees (round trip)
  const beMove = ptVal*lots > 0 ? (fees*lots)/(ptVal*lots) : 0;
  document.getElementById('outBE').textContent = beMove.toFixed(2)+' pts';

  // Multi-RR snapshot table
  rrTableBody.innerHTML = RR_PRESETS.map(rr=>{
    const td = stopDist*rr;
    const tp = selectedDir==='BUY' ? entry+td : entry-td;
    const pf = td*ptVal*lots - fees*lots;
    return `<tr><td>1:${rr}</td><td>${tp.toFixed(2)}</td><td style="color:var(--green)">+$${pf.toFixed(2)}</td></tr>`;
  }).join('');

  // Partial exit plan
  if(document.getElementById('partialMode').checked){
    const rr1 = parseFloat(document.getElementById('rr1').value)||0;
    const rr1pct = parseFloat(document.getElementById('rr1pct').value)||0;
    const rr2 = parseFloat(document.getElementById('rr2').value)||0;
    const rr2pct = parseFloat(document.getElementById('rr2pct').value)||0;

    const lots1 = lots * (rr1pct/100);
    const lots2 = lots * (rr2pct/100);
    const dist1 = stopDist*rr1;
    const dist2 = stopDist*rr2;
    const tp1 = selectedDir==='BUY' ? entry+dist1 : entry-dist1;
    const tp2 = selectedDir==='BUY' ? entry+dist2 : entry-dist2;
    const profit1 = dist1*ptVal*lots1;
    const profit2 = dist2*ptVal*lots2;

    document.getElementById('outLeg1').textContent = `${tp1.toFixed(2)} @ ${lots1.toFixed(2)} lot`;
    document.getElementById('outLeg1Profit').textContent = '$'+profit1.toFixed(2);
    document.getElementById('outLeg2').textContent = `${tp2.toFixed(2)} @ ${lots2.toFixed(2)} lot`;
    document.getElementById('outLeg2Profit').textContent = '$'+profit2.toFixed(2);
  }
}

// ===================== JOURNAL =====================
function getEntries(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e){ return []; }
}
function saveEntries(entries){ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), 2200);
}

document.getElementById('btnJournal').addEventListener('click', ()=>{
  const capital = parseFloat(document.getElementById('capital').value) || 0;
  const entry = parseFloat(document.getElementById('entry').value);
  const stop = parseFloat(document.getElementById('stop').value);
  if(isNaN(entry) || isNaN(stop)){
    showToast('Enter valid Entry & Stop prices first');
    return;
  }
  const riskAmt = capital * (selectedRisk/100);
  const ptVal = POINT_VALUE[selectedInstr];
  const stopDist = Math.abs(entry-stop);
  const lots = riskAmt/(stopDist*ptVal);
  const targetDist = stopDist*selectedRR;
  const targetPrice = selectedDir==='BUY' ? entry+targetDist : entry-targetDist;
  const loss = stopDist*ptVal*lots;
  const profit = targetDist*ptVal*lots;

  const trade = {
    id: Date.now(),
    date: new Date().toISOString(),
    dateDisplay: new Date().toLocaleString(),
    instr: selectedInstr,
    dir: selectedDir,
    entry, stop, target: targetPrice,
    rr: selectedRR,
    risk: selectedRisk,
    lots: lots.toFixed(2),
    potentialLoss: loss.toFixed(2),
    potentialProfit: profit.toFixed(2),
    result: 'open',
    actualPL: null
  };
  const entries = getEntries();
  entries.unshift(trade);
  saveEntries(entries);
  showToast('Trade added to journal ✓');
});

function renderJournal(){
  const search = (document.getElementById('journalSearch').value||'').toLowerCase();
  const filter = document.getElementById('journalFilter').value;
  let entries = getEntries();

  if(filter !== 'all') entries = entries.filter(e=>e.result===filter);
  if(search) entries = entries.filter(e=>
    (e.instr+' '+e.dir+' '+(e.notes||'')).toLowerCase().includes(search)
  );

  const list = document.getElementById('journalList');
  if(entries.length===0){
    list.innerHTML = '<div class="empty">No trades match.</div>';
    return;
  }
  list.innerHTML = entries.map(t=>{
    const cls = t.result==='win' ? 'win' : t.result==='loss' ? 'loss' : t.result==='be' ? 'be' : '';
    const resultLabel = t.result==='open' ? 'OPEN' : t.result.toUpperCase();
    return `
    <div class="journal-entry ${cls}">
      <div class="je-top">
        <span>${t.instr} · ${t.dir} <span class="badge">${resultLabel}</span></span>
        <span>${t.lots} lot</span>
      </div>
      <div class="je-meta">
        ${t.dateDisplay || t.date}<br>
        Entry ${t.entry} → Stop ${t.stop} → Target ${(+t.target).toFixed(2)}<br>
        Risk ${t.risk}% · R:R 1:${t.rr} · Potential: -$${t.potentialLoss} / +$${t.potentialProfit}
        ${t.actualPL!==null ? `<br>Actual P/L: <b>${t.actualPL>=0?'+':''}$${t.actualPL}</b>` : ''}
      </div>
      <div class="je-actions">
        <button onclick="markResult(${t.id},'win')">Mark Win</button>
        <button onclick="markResult(${t.id},'loss')">Mark Loss</button>
        <button onclick="markResult(${t.id},'be')">Break Even</button>
        <button onclick="deleteEntry(${t.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

window.markResult = function(id, result){
  const entries = getEntries();
  const t = entries.find(e=>e.id===id);
  if(!t) return;
  let pl = 0;
  if(result==='win') pl = parseFloat(t.potentialProfit);
  else if(result==='loss') pl = -parseFloat(t.potentialLoss);
  const custom = prompt('Actual P/L for this trade ($):', pl);
  if(custom !== null && custom !== ''){
    pl = parseFloat(custom);
    if(isNaN(pl)) pl = 0;
  }
  t.result = result;
  t.actualPL = pl.toFixed(2);
  saveEntries(entries);
  renderJournal();
};

window.deleteEntry = function(id){
  if(!confirm('Delete this journal entry?')) return;
  let entries = getEntries();
  entries = entries.filter(e=>e.id!==id);
  saveEntries(entries);
  renderJournal();
};

document.getElementById('journalSearch').addEventListener('input', renderJournal);
document.getElementById('journalFilter').addEventListener('change', renderJournal);

document.getElementById('btnReset').addEventListener('click', ()=>{
  if(confirm('This will permanently delete ALL journal entries. Continue?')){
    localStorage.removeItem(STORAGE_KEY);
    renderJournal();
    renderStats();
    showToast('Journal reset');
  }
});

// Export / Import
document.getElementById('btnExport').addEventListener('click', ()=>{
  const data = JSON.stringify(getEntries(), null, 2);
  downloadFile(data, 'journal-export.json', 'application/json');
});
document.getElementById('btnExportCSV').addEventListener('click', ()=>{
  const entries = getEntries();
  const headers = ['date','instr','dir','entry','stop','target','rr','risk','lots','potentialLoss','potentialProfit','result','actualPL'];
  const rows = entries.map(e=>headers.map(h=>e[h]).join(','));
  const csv = headers.join(',')+'\n'+rows.join('\n');
  downloadFile(csv, 'journal-export.csv', 'text/csv');
});
function downloadFile(content, filename, type){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
document.getElementById('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt)=>{
    try{
      const imported = JSON.parse(evt.target.result);
      if(!Array.isArray(imported)) throw new Error('bad format');
      const existing = getEntries();
      const merged = [...imported, ...existing];
      saveEntries(merged);
      renderJournal();
      showToast('Journal imported ✓');
    }catch(err){
      showToast('Import failed: invalid file');
    }
  };
  reader.readAsText(file);
});

// ===================== STATS =====================
function renderStats(){
  const entries = getEntries().filter(e=>e.result!=='open');
  const total = entries.length;
  document.getElementById('stTotal').textContent = total;

  if(total===0){
    ['stWinRate','stAvgWin','stAvgLoss','stNetPL','stAvgRR','stExpectancy','stProfitFactor'].forEach(id=>{
      document.getElementById(id).textContent = id==='stWinRate' ? '0%' : '0';
    });
    drawEquityCurve([]);
    return;
  }

  const wins = entries.filter(e=>parseFloat(e.actualPL) > 0);
  const losses = entries.filter(e=>parseFloat(e.actualPL) < 0);
  const winRate = (wins.length/total*100).toFixed(1);
  const avgWin = wins.length ? (wins.reduce((s,e)=>s+parseFloat(e.actualPL),0)/wins.length) : 0;
  const avgLoss = losses.length ? (losses.reduce((s,e)=>s+parseFloat(e.actualPL),0)/losses.length) : 0;
  const netPL = entries.reduce((s,e)=>s+parseFloat(e.actualPL),0);
  const avgRR = entries.reduce((s,e)=>s+parseFloat(e.rr),0)/total;
  const expectancy = netPL/total;
  const grossWin = wins.reduce((s,e)=>s+parseFloat(e.actualPL),0);
  const grossLoss = Math.abs(losses.reduce((s,e)=>s+parseFloat(e.actualPL),0));
  const profitFactor = grossLoss>0 ? (grossWin/grossLoss) : (grossWin>0 ? Infinity : 0);

  document.getElementById('stWinRate').textContent = winRate+'%';
  document.getElementById('stAvgWin').textContent = '$'+avgWin.toFixed(2);
  document.getElementById('stAvgLoss').textContent = '$'+avgLoss.toFixed(2);
  document.getElementById('stNetPL').textContent = (netPL>=0?'+':'')+'$'+netPL.toFixed(2);
  document.getElementById('stNetPL').style.color = netPL>=0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('stAvgRR').textContent = '1:'+avgRR.toFixed(2);
  document.getElementById('stExpectancy').textContent = (expectancy>=0?'+':'')+'$'+expectancy.toFixed(2);
  document.getElementById('stProfitFactor').textContent = isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞';

  // equity curve oldest -> newest
  const chronological = [...entries].reverse();
  let running = 0;
  const points = chronological.map(e=>{ running += parseFloat(e.actualPL); return running; });
  drawEquityCurve(points);
}

function drawEquityCurve(points){
  const canvas = document.getElementById('equityChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  if(points.length < 2){
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Not enough closed trades yet', w/2, h/2);
    return;
  }

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = (max-min) || 1;
  const padding = 20;

  // zero line
  const zeroY = h - padding - ((0-min)/range)*(h-2*padding);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border');
  ctx.beginPath();
  ctx.moveTo(padding, zeroY);
  ctx.lineTo(w-padding, zeroY);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = points[points.length-1] >= 0 ? '#2ecc71' : '#e74c3c';
  ctx.lineWidth = 2;
  points.forEach((p,i)=>{
    const x = padding + (i/(points.length-1))*(w-2*padding);
    const y = h - padding - ((p-min)/range)*(h-2*padding);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
}

// ===================== RISK GUARD =====================
['maxDailyLossVal','maxDailyLossType','maxTradesDay'].forEach(id=>{
  document.getElementById(id).addEventListener('input', renderRiskGuard);
  document.getElementById(id).addEventListener('change', renderRiskGuard);
});

function renderRiskGuard(){
  const capital = parseFloat(document.getElementById('capital').value) || 0;
  const entries = getEntries();
  const today = new Date().toDateString();
  const todaysEntries = entries.filter(e=> new Date(e.date).toDateString() === today && e.result!=='open');

  const todayPL = todaysEntries.reduce((s,e)=>s+parseFloat(e.actualPL||0),0);
  document.getElementById('todayPL').textContent = (todayPL>=0?'+':'')+'$'+todayPL.toFixed(2);
  document.getElementById('todayPL').parentElement.querySelector('.lotval').style.color = todayPL>=0 ? 'var(--green)':'var(--red)';
  document.getElementById('tradesToday').textContent = todaysEntries.length;

  const lossVal = parseFloat(document.getElementById('maxDailyLossVal').value);
  const lossType = document.getElementById('maxDailyLossType').value;
  const maxTrades = parseInt(document.getElementById('maxTradesDay').value);

  let limitUsd = null;
  if(!isNaN(lossVal)){
    limitUsd = lossType==='pct' ? capital*(lossVal/100) : lossVal;
    document.getElementById('dailyLimitVal').textContent = '-$'+limitUsd.toFixed(2);
    const remaining = limitUsd + todayPL; // todayPL negative reduces buffer
    document.getElementById('remainingBuffer').textContent = '$'+Math.max(remaining,0).toFixed(2);

    let status = '✅ OK';
    if(todayPL <= -limitUsd) status = '🛑 LIMIT HIT — STOP TRADING';
    else if(todayPL <= -limitUsd*0.7) status = '⚠️ Approaching limit';
    document.getElementById('riskStatus').textContent = status;
    document.getElementById('riskStatus').style.color = status.includes('STOP') ? 'var(--red)' : status.includes('Approaching') ? '#e0a800' : 'var(--green)';
  } else {
    document.getElementById('dailyLimitVal').textContent = '-';
    document.getElementById('remainingBuffer').textContent = '-';
    document.getElementById('riskStatus').textContent = '-';
  }

  if(!isNaN(maxTrades) && todaysEntries.length >= maxTrades){
    document.getElementById('riskStatus').textContent = '🛑 TRADE LIMIT REACHED';
    document.getElementById('riskStatus').style.color = 'var(--red)';
  }
}

// ===================== INIT =====================
document.querySelector('#riskPills .pill[data-risk="2"]').classList.add('active');
calculate();

// ===================== SERVICE WORKER (offline support) =====================
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
