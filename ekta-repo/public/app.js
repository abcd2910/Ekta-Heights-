const TEAM=[
  {id:'VAN',name:'Vandit',role:'Banking & Documentation',
   cats:['Banking','Dastavej','Banakhat','Ashant','Loan']},
  {id:'SID',name:'Sidharth',role:'Site Visit & Customer Info',
   cats:['Site Visit / Inquiry','KYC','Basic Details']},
  {id:'RAS',name:'Rashmi',role:'Follow-up & Booking Admin',
   cats:['Follow-up Call','Site Visit','Cheque Deposit','Booking Cancellation','Master File Update']},
  {id:'BEL',name:"Bela Ma'am",role:'Booking Docs & Site Customers',
   cats:['Booking Form','Site Visit / Inquiry','KYC','Basic Details']},
  {id:'RAJ',name:'Raj',role:'Project & Team Coordinator',
   cats:['Coordination','Pending Follow-up','Escalation','Handoff','Update Compliance']},
  {id:'HAR',name:'Harsh Bhai',role:'Site Visit & Banking Support',
   cats:['Site Visit','Banking Support']}
];
const ACTIONS={
 'Banking':['Open customer file with bank','Submit documents to bank','Coordinate with bank officer','Collect bank confirmation'],
 'Dastavej':['Prepare dastavej set','Submit dastavej to office','Collect signed dastavej','Follow up on pending dastavej'],
 'Banakhat':['Prepare banakhat draft','Send banakhat to customer','Collect signed banakhat','Follow up on pending banakhat'],
 'Ashant':['Initiate ashant work','Follow up on ashant clearance','Collect ashant document'],
 'Loan':['Submit loan file','Follow up on sanction','Collect sanction letter','Coordinate disbursement'],
 'Site Visit / Inquiry':['Handle site visit','Handle inquiry','Record visit details','Hand over for follow-up'],
 'Site Visit':['Handle site visit','Accompany site visit','Record visit details'],
 'KYC':['Complete KYC form','Collect KYC documents','Mark KYC not required with reason'],
 'Basic Details':['Capture name, phone, requirement','Update customer requirement','Correct incomplete record'],
 'Follow-up Call':['First follow-up call','Repeat follow-up call','Schedule site visit','Record customer response'],
 'Cheque Deposit':['Collect booking cheque','Deposit cheque','Record deposit against customer'],
 'Booking Cancellation':['Record cancellation request','Process cancellation','Obtain approval'],
 'Master File Update':['Update visit outcomes','Update follow-up status','Reconcile master file'],
 'Booking Form':['Complete booking form','Check and file booking form','Collect pending signature'],
 'Coordination':['Coordinate between two owners','Confirm work ownership','Verify update submitted'],
 'Pending Follow-up':['Chase overdue item','Review pending list with owner'],
 'Escalation':['Escalate to management','Record management decision'],
 'Handoff':['Confirm handoff accepted','Reassign unaccepted handoff'],
 'Update Compliance':['Confirm all daily updates submitted','Chase missing update'],
 'Banking Support':['Collect documents for Vandit','Bank errand','Return item to owner']
};

const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=iso(new Date());
const nice=s=>{ if(!s) return '—'; const [y,m,d]=s.split('-');
  return d+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]; };
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let ME=null, READY=false, CANWRITE=true, ITEMS=[], VIEW='me', CLOSING=null;

/* Read-only mode: open the page with #admin (the link you give the CFO).
   Entry controls are hidden and the page opens on Management. */
const READONLY = location.hash.toLowerCase().indexOf('admin') > -1;
if(READONLY) CANWRITE=false;
try{ ME=localStorage.getItem('ekta.me'); }catch(e){}

document.getElementById('today').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

/* ---------- sheets ---------- */
function openSheet(n){ document.getElementById(n+'sheet').dataset.open='1'; }
function closeSheet(n){ document.getElementById(n+'sheet').dataset.open='0'; }
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-close]'); if(t) closeSheet(t.dataset.close);
});

/* ---------- identity ---------- */
function meObj(){ return TEAM.find(t=>t.id===ME)||null; }
function renderWho(){
  const m=meObj();
  document.getElementById('whobtn').textContent = m? m.name : 'Set name';
  document.getElementById('fab').hidden = !m || VIEW!=='me' || CANWRITE===false;
}
document.getElementById('namegrid').innerHTML=TEAM.map(t=>
  `<button class="namebtn" data-id="${t.id}"><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></button>`).join('');
document.getElementById('namegrid').addEventListener('click',e=>{
  const b=e.target.closest('[data-id]'); if(!b) return;
  ME=b.dataset.id;
  try{ localStorage.setItem('ekta.me',ME); }catch(err){}
  closeSheet('name'); renderWho(); fillCats(); render();
});
document.getElementById('whobtn').onclick=()=>openSheet('name');

/* ---------- tabs ---------- */
function setView(v){
  VIEW=v;
  ['me','team','mgmt'].forEach(k=>{
    document.getElementById('tab-'+k).setAttribute('aria-selected',String(v===k));
    document.getElementById('view-'+k).hidden = v!==k;
  });
  document.getElementById('fab').hidden = (v!=='me') || !meObj() || CANWRITE===false;
  render();
}
document.getElementById('tab-me').onclick=()=>setView('me');
document.getElementById('tab-team').onclick=()=>setView('team');
document.getElementById('tab-mgmt').onclick=()=>setView('mgmt');

/* ---------- entry form ---------- */
function fillCats(){
  const m=meObj(); if(!m) return;
  const c=document.getElementById('e-cat');
  c.innerHTML=m.cats.map(x=>`<option>${esc(x)}</option>`).join('');
  fillActions();
}
function fillActions(){
  const c=document.getElementById('e-cat').value;
  document.getElementById('e-exp').innerHTML=(ACTIONS[c]||['Other']).map(a=>`<option>${esc(a)}</option>`).join('');
}
document.getElementById('e-cat').onchange=fillActions;
function togglePend(){ document.getElementById('e-cond').hidden=!document.getElementById('e-st-p').checked; }
document.getElementById('e-st-c').onchange=togglePend;
document.getElementById('e-st-p').onchange=togglePend;
document.getElementById('e-due').value=TODAY;

document.getElementById('addbtn').onclick=()=>{
  if(!meObj()){ openSheet('name'); return; }
  document.getElementById('e-msg').innerHTML='';
  openSheet('entry');
};

async function saveNew(){
  const msg=document.getElementById('e-msg');
  const m=meObj(); if(!m) return;
  const cat=document.getElementById('e-cat').value;
  const cust=document.getElementById('e-cust').value.trim();
  const exp=document.getElementById('e-exp').value;
  const act=document.getElementById('e-act').value.trim();
  const pend=document.getElementById('e-st-p').checked;
  const reason=document.getElementById('e-reason').value;
  const next=document.getElementById('e-next').value.trim();
  const due=document.getElementById('e-due').value;
  const rem=document.getElementById('e-rem').value.trim();

  const miss=[];
  if(!cust) miss.push('customer / file');
  if(!act) miss.push('what happened');
  if(pend){ if(!reason) miss.push('pending reason'); if(!next) miss.push('next action'); if(!due) miss.push('due date'); }
  if(miss.length){ msg.className='msg err'; msg.textContent='Missing: '+miss.join(', ')+'.'; return; }
  if(!READY){ msg.className='msg err'; msg.textContent='Not connected to the database — your update was not saved. Reload and try again.'; return; }
  if(READONLY){ msg.className='msg err'; msg.textContent='This link is read-only.'; return; }

  const btn=document.getElementById('e-save'); btn.disabled=true; btn.textContent='Saving…';
  const id=TODAY.replace(/-/g,'')+'-'+m.id+'-'+Math.random().toString(36).slice(2,8);
  try{
    await Store.create({
      id, emp:m.id, emp_name:m.name, cat, customer:cust, expected:exp, actual:act,
      status: pend?'Pending':'Completed',
      reason: pend?reason:'', next_action: pend?next:'', due: pend?due:null,
      remarks:rem, log_date:TODAY, completed_on: pend?null:TODAY
    });
    await refresh();
    msg.className='msg ok'; msg.textContent='Saved.';
    ['e-cust','e-act','e-next','e-rem'].forEach(x=>document.getElementById(x).value='');
    document.getElementById('e-reason').value='';
    setTimeout(()=>{ closeSheet('entry'); msg.innerHTML=''; },600);
  }catch(err){
    msg.className='msg err';
    msg.textContent = err && err.denied
      ? 'Saving was refused by the database. Check the setup steps in README.md.'
      : 'Could not save. Check your connection and try again.';
  }finally{ btn.disabled=false; btn.textContent='Save update'; }
}
document.getElementById('e-save').onclick=saveNew;

/* ---------- close / update item ---------- */
function toggleClosePend(){ document.getElementById('c-cond').hidden=!document.getElementById('c-st-p').checked; }
document.getElementById('c-st-c').onchange=toggleClosePend;
document.getElementById('c-st-p').onchange=toggleClosePend;

function openClose(id){
  const it=ITEMS.find(i=>i.id===id); if(!it) return;
  CLOSING=it;
  document.getElementById('closectx').innerHTML=
    `<div style="background:var(--surface-2);border-radius:8px;padding:12px">
      <div style="font-weight:600">${esc(it.customer)}</div>
      <div style="font-size:12.5px;color:var(--ink-3);margin-top:2px">${esc(it.cat)} · due ${nice(it.due)}</div>
      <div style="font-size:13px;color:var(--ink-2);margin-top:6px"><b>Next action:</b> ${esc(it.next||'—')}</div>
    </div>`;
  document.getElementById('c-act').value='';
  document.getElementById('c-next').value=it.next||'';
  document.getElementById('c-due').value=it.due||TODAY;
  document.getElementById('c-reason').value=it.reason||'';
  document.getElementById('c-st-c').checked=true;
  toggleClosePend();
  document.getElementById('c-msg').innerHTML='';
  openSheet('close');
}

async function saveClose(){
  const msg=document.getElementById('c-msg'); if(!CLOSING) return;
  const act=document.getElementById('c-act').value.trim();
  const pend=document.getElementById('c-st-p').checked;
  const reason=document.getElementById('c-reason').value;
  const next=document.getElementById('c-next').value.trim();
  const due=document.getElementById('c-due').value;
  const miss=[];
  if(!act) miss.push('what happened');
  if(pend){ if(!reason) miss.push('reason'); if(!next) miss.push('next action'); if(!due) miss.push('new due date'); }
  if(miss.length){ msg.className='msg err'; msg.textContent='Missing: '+miss.join(', ')+'.'; return; }
  if(!READY){ msg.className='msg err'; msg.textContent='Not connected to the database — nothing was saved.'; return; }
  if(READONLY){ msg.className='msg err'; msg.textContent='This link is read-only.'; return; }

  const btn=document.getElementById('c-save'); btn.disabled=true; btn.textContent='Saving…';
  try{
    await Store.update(CLOSING.id, {
      actual:act, status: pend?'Pending':'Completed',
      reason: pend?reason:'', next_action: pend?next:'', due: pend?due:CLOSING.due,
      completed_on: pend?null:TODAY
    });
    closeSheet('close'); CLOSING=null; await refresh();
  }catch(err){
    msg.className='msg err';
    msg.textContent = err && err.denied
      ? 'Saving was refused by the database. Check the setup steps in README.md.'
      : 'Could not save. Try again.';
  }finally{ btn.disabled=false; btn.textContent='Save'; }
}
document.getElementById('c-save').onclick=saveClose;

/* ---------- derive ---------- */
const isOverdue=i=>i.status==='Pending' && i.due && i.due<TODAY;
const stateOf=i=> i.status==='Completed' ? 'done' : (isOverdue(i)?'over':'pend');

function itemHTML(i,showOwner){
  const st=stateOf(i);
  const tag = st==='done' ? '<span class="tag done">Completed</span>'
            : st==='over' ? '<span class="tag over">Overdue</span>'
            : '<span class="tag pend">Pending</span>';
  const lines=[];
  if(i.actual) lines.push(`<div class="line">${esc(i.actual)}</div>`);
  if(i.status==='Pending'){
    lines.push(`<div class="line"><b>Why:</b> ${esc(i.reason||'not recorded')}</div>`);
    lines.push(`<div class="line"><b>Next:</b> ${esc(i.next||'not set')} · due ${nice(i.due)}</div>`);
  }
  const act = (i.status==='Pending' && i.emp===ME)
    ? `<div class="item-act"><button class="btn primary" data-close-item="${esc(i.id)}">Update this item</button></div>` : '';
  return `<div class="item">
    <div class="item-top">
      <div><div class="cust">${esc(i.customer)}</div>
        <div class="meta">${showOwner?esc(i.empName)+' · ':''}${esc(i.cat)} · ${esc(i.expected)}</div></div>
      ${tag}
    </div>${lines.join('')}${act}</div>`;
}

function sq(n,l,cls){ return `<div class="sq ${cls||''}"><div class="n num">${n}</div><div class="l">${l}</div></div>`; }

function render(){
  renderWho();
  const m=meObj();

  if(VIEW==='mgmt'){ renderMgmt(); return; }
  if(VIEW==='me'){
    if(!m){
      document.getElementById('mysummary').innerHTML='';
      document.getElementById('openlist').innerHTML='<div class="empty"><b>Pick your name to start</b>Tap the button at the top right.</div>';
      document.getElementById('todaylist').innerHTML='<div class="empty">—</div>';
      document.getElementById('opencnt').textContent=''; document.getElementById('todaycnt').textContent='';
      return;
    }
    const mine=ITEMS.filter(i=>i.emp===ME);
    const open=mine.filter(i=>i.status==='Pending')
      .sort((a,b)=> (a.due||'9999').localeCompare(b.due||'9999'));
    const todayDone=mine.filter(i=>i.completedOn===TODAY);
    const loggedToday=mine.filter(i=>i.logDate===TODAY);
    const overdue=open.filter(isOverdue).length;

    document.getElementById('mysummary').innerHTML=
      sq(todayDone.length,'Closed today','g')+sq(open.length-overdue,'Pending','w')+sq(overdue,'Overdue',overdue?'c':'');
    document.getElementById('opencnt').textContent=open.length?open.length+' open':'';
    document.getElementById('openlist').innerHTML = open.length
      ? open.map(i=>itemHTML(i,false)).join('')
      : '<div class="empty"><b>Nothing pending</b>Every item you logged is closed.</div>';
    document.getElementById('todaycnt').textContent=loggedToday.length?loggedToday.length+' entries':'';
    document.getElementById('todaylist').innerHTML = loggedToday.length
      ? loggedToday.map(i=>itemHTML(i,false)).join('')
      : '<div class="empty"><b>Nothing logged yet today</b>Tap “Add work update” below.</div>';
  } else {
    const done=ITEMS.filter(i=>i.completedOn===TODAY).length;
    const openAll=ITEMS.filter(i=>i.status==='Pending');
    const over=openAll.filter(isOverdue);
    const notSub=TEAM.filter(t=>!ITEMS.some(i=>i.emp===t.id && i.logDate===TODAY));
    document.getElementById('teamsummary').innerHTML=
      sq(done,'Closed today','g')+sq(openAll.length-over.length,'Pending','w')+sq(over.length,'Overdue',over.length?'c':'');

    const escl=[];
    over.forEach(i=>escl.push({sev:'c',who:i.empName+' · '+i.cat,what:i.customer,
      why:'Overdue since '+nice(i.due)+'. '+(i.reason?('Reason: '+i.reason+'. '):'No reason recorded. ')+(i.next?('Next: '+i.next+'.'):'No next action set.')}));
    openAll.filter(i=>!isOverdue(i) && (!i.reason||!i.next)).forEach(i=>escl.push({sev:'w',who:i.empName+' · '+i.cat,
      what:i.customer,why:'Pending without '+(!i.reason?'a reason':'a next action')+'.'}));
    notSub.forEach(t=>escl.push({sev:'w',who:t.name,what:'No update submitted today',why:'Nothing logged. Chase before 7 PM.'}));
    escl.sort((a,b)=>(a.sev==='c'?0:1)-(b.sev==='c'?0:1));

    document.getElementById('esccnt').textContent=escl.length?escl.length:'';
    document.getElementById('esclist').innerHTML = escl.length
      ? escl.map(e=>`<div class="esc"><div class="escbar ${e.sev==='c'?'':'w'}"></div>
          <div><div class="who2">${esc(e.who)}</div><div class="wh">${esc(e.what)}</div><div class="wy">${esc(e.why)}</div></div></div>`).join('')
      : '<div class="empty"><b>All clear</b>Everyone has submitted and nothing is overdue.</div>';

    document.getElementById('teamlist').innerHTML=TEAM.map(t=>{
      const mineT=ITEMS.filter(i=>i.emp===t.id);
      const d=mineT.filter(i=>i.completedOn===TODAY).length;
      const p=mineT.filter(i=>i.status==='Pending'&&!isOverdue(i)).length;
      const o=mineT.filter(isOverdue).length;
      const sub=mineT.some(i=>i.logDate===TODAY);
      return `<div class="trow"><div><div class="nm">${esc(t.name)}</div><div class="rl">${esc(t.role)}</div></div>
        <div class="counts">${sub?'':'<span class="nosub">Not submitted</span>'}
          <span class="pipm ${d?'d':'z'}">${d}</span><span class="pipm ${p?'p':'z'}">${p}</span><span class="pipm ${o?'o':'z'}">${o}</span></div></div>`;
    }).join('');
  }
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-close-item]'); if(b) openClose(b.dataset.closeItem);
});

renderWho(); render();
if(!ME) openSheet('name');


/* ---------- management ---------- */
let PERIOD=30;
const PERIODS=[[1,'Today'],[7,'Last 7 days'],[30,'Last 30 days'],[90,'Last 90 days'],[0,'All time']];
function periodStart(){
  if(!PERIOD) return '0000-00-00';
  const d=new Date(); d.setDate(d.getDate()-(PERIOD-1)); return iso(d);
}
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function ageOf(i){ return i.logDate? Math.max(0,daysBetween(i.logDate,TODAY)) : 0; }
function pctBar(p){
  const c = p>=85?'':p>=60?'mid':'low';
  return `<div class="mini"><div class="mtrack"><div class="mfill ${c}" style="width:${p}%"></div></div><div class="mval num">${p}%</div></div>`;
}
function kpi(n,l,sub,cls){ return `<div class="kpi ${cls||''}"><div class="n num">${n}</div><div class="l">${l}</div><div class="s">${sub}</div></div>`; }

document.getElementById('periods').innerHTML=PERIODS.map(p=>
  `<button data-p="${p[0]}" aria-pressed="${p[0]===PERIOD}">${p[1]}</button>`).join('');
document.getElementById('periods').addEventListener('click',e=>{
  const b=e.target.closest('[data-p]'); if(!b) return;
  PERIOD=+b.dataset.p;
  [...document.querySelectorAll('#periods button')].forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.p===PERIOD)));
  renderMgmt();
});

function renderMgmt(){
  const from=periodStart();
  const inP = d => !!d && d>=from;
  const logged = ITEMS.filter(i=>inP(i.logDate));
  const closed = ITEMS.filter(i=>inP(i.completedOn));
  const openAll = ITEMS.filter(i=>i.status==='Pending');
  const over = openAll.filter(isOverdue);
  const withDue = closed.filter(i=>i.due);
  const onTime = withDue.filter(i=>i.completedOn<=i.due).length;
  const clean = openAll.filter(i=>i.reason&&i.next).length;

  const compPct = logged.length? Math.round(closed.length/logged.length*100):0;
  const onTimePct = withDue.length? Math.round(onTime/withDue.length*100):0;
  const discPct = openAll.length? Math.round(clean/openAll.length*100):100;
  const label = PERIODS.find(p=>p[0]===PERIOD)[1].toLowerCase();

  document.getElementById('periodnote').textContent = logged.length+' items logged '+label;
  document.getElementById('mgmtrange').textContent = label;
  document.getElementById('mkpis').innerHTML=
    kpi(logged.length,'Items logged','work that entered the system')+
    kpi(compPct+'%','Completion','closed vs logged '+label, compPct>=85?'g':compPct>=60?'w':'c')+
    kpi(onTimePct+'%','On time','closed on or before due date', onTimePct>=85?'g':onTimePct>=60?'w':'c')+
    kpi(over.length,'Overdue open','past due, still not closed', over.length?'c':'g')+
    kpi(discPct+'%','Discipline','open items with a reason and next action', discPct>=90?'g':discPct>=70?'w':'c');

  document.getElementById('mgmttable').innerHTML=TEAM.map(t=>{
    const L=logged.filter(i=>i.emp===t.id), C=closed.filter(i=>i.emp===t.id);
    const O=over.filter(i=>i.emp===t.id), OP=openAll.filter(i=>i.emp===t.id);
    const wd=C.filter(i=>i.due), ot=wd.filter(i=>i.completedOn<=i.due).length;
    const cp=L.length?Math.round(C.length/L.length*100):0;
    const op=wd.length?Math.round(ot/wd.length*100):0;
    const dp=OP.length?Math.round(OP.filter(i=>i.reason&&i.next).length/OP.length*100):100;
    return `<tr><td class="nm2">${esc(t.name)}</td><td class="num">${L.length}</td><td class="num">${C.length}</td>
      <td>${pctBar(cp)}</td><td>${pctBar(op)}</td>
      <td class="num">${O.length?'<span class="tag over">'+O.length+'</span>':'0'}</td>
      <td>${pctBar(dp)}</td></tr>`;
  }).join('');

  const buckets=[['0-3 days',0,3],['4-7 days',4,7],['8-15 days',8,15],['15+ days',16,9999]];
  const counts=buckets.map(b=>openAll.filter(i=>{const a=ageOf(i);return a>=b[1]&&a<=b[2];}).length);
  const max=Math.max(1,...counts);
  document.getElementById('agecnt').textContent=openAll.length+' open';
  document.getElementById('ages').innerHTML= openAll.length? buckets.map((b,n)=>
    `<div class="agerow"><div class="lab">${b[0]}</div>
      <div class="agebar b${n+1}" style="width:${Math.max(2,counts[n]/max*100)}%"></div>
      <div class="cv num">${counts[n]}</div></div>`).join('')
    : '<div class="empty"><b>Nothing open</b>All logged work is closed.</div>';

  const cats={};
  openAll.forEach(i=>{ (cats[i.cat]=cats[i.cat]||[]).push(i); });
  const catRows=Object.entries(cats).sort((a,b)=>b[1].length-a[1].length);
  document.getElementById('cattable').innerHTML= catRows.length? catRows.map(([c,arr])=>{
    const owners=[...new Set(arr.map(i=>i.empName))].join(', ');
    const ov=arr.filter(isOverdue).length;
    const oldest=Math.max(...arr.map(ageOf));
    return `<tr><td class="nm2">${esc(c)}</td><td>${esc(owners)}</td><td class="num">${arr.length}</td>
      <td class="num">${ov?'<span class="tag over">'+ov+'</span>':'0'}</td><td class="num">${oldest} d</td></tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--ink-3)">No open work.</td></tr>';

  const long=openAll.filter(i=>ageOf(i)>=15).sort((a,b)=>ageOf(b)-ageOf(a));
  document.getElementById('longcnt').textContent=long.length?long.length:'';
  document.getElementById('longlist').innerHTML= long.length? long.map(i=>
    `<div class="esc"><div class="escbar"></div><div>
      <div class="who2">${esc(i.empName)} · ${esc(i.cat)} · ${ageOf(i)} days open</div>
      <div class="wh">${esc(i.customer)}</div>
      <div class="wy">${esc(i.reason||'No reason recorded')}. Next: ${esc(i.next||'not set')}. Due ${nice(i.due)}.</div>
    </div></div>`).join('')
    : '<div class="empty"><b>Nothing older than 15 days</b>No work has been sitting long enough to need a decision.</div>';
}

/* ---------- export ---------- */
document.getElementById('expnote').textContent='One row per work item, opens in Excel or Google Sheets.';
document.getElementById('expbtn').onclick=()=>{
  const cols=['Employee','Category','Customer / File','Expected action','What happened','Status','Pending reason','Next action','Due date','Logged on','Closed on','Days open','Remarks'];
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=ITEMS.map(i=>[i.empName,i.cat,i.customer,i.expected,i.actual,
    isOverdue(i)?'Overdue':i.status,i.reason,i.next,i.due,i.logDate,i.completedOn,ageOf(i),i.remarks].map(q).join(','));
  const csv='\ufeff'+[cols.map(q).join(',')].concat(rows).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');
  a.href=url; a.download='ekta-heights-work-'+TODAY+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
};

/* ---------- connect ---------- */
const banner=document.getElementById('banner');

async function refresh(){
  try{
    ITEMS=await Store.list();
    READY=true;
    if(banner.dataset.err){ banner.innerHTML=''; delete banner.dataset.err; }
    render();
  }catch(err){
    READY=false;
    banner.dataset.err='1';
    banner.innerHTML='<div class="banner">'+(err && err.setup
      ? 'Database is not configured yet. Open config.js and add your Supabase URL and key — see README.md.'
      : 'Cannot reach the database right now. Your work is safe; this page will keep trying.')+'</div>';
  }
}

if(READONLY){
  banner.innerHTML='<div class="banner">Read-only link \u2014 monitoring view. Entries cannot be added from here.</div>';
  setView('mgmt');
}

refresh();
setInterval(()=>{ if(document.visibilityState==='visible') refresh(); }, 20000);
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') refresh(); });
