const plans={
1:{focus:'CHEST',ex:[['Chest Press','3 × 8–12'],['Incline Dumbbell Press','3 × 8–12'],['Cable Fly','2 × 12–15']]},
2:{focus:'BACK',ex:[['Lat Pulldown','3 × 8–12'],['Seated Cable Row','3 × 8–12'],['Chest-Supported Row','2 × 10–12']]},
3:{focus:'LEGS',ex:[['Leg Press','3 × 8–12'],['Leg Curl','3 × 10–15'],['Leg Extension','2 × 10–15'],['Calf Raises','3 × 12–15']]},
4:{focus:'SHOULDERS',ex:[['Shoulder Press','3 × 8–12'],['Lateral Raises','3 × 12–15'],['Reverse Fly','3 × 12–15']]},
5:{focus:'ARMS',ex:[['Dumbbell Curl','3 × 8–12'],['Hammer Curl','2 × 10–12'],['Triceps Pushdown','3 × 8–12'],['Overhead Triceps Extension','2 × 10–12']]}
};

const defaultState={level:1,checkpoint:0,stats:{STR:0,STA:0,MND:0,WIL:0,FOC:0,DIS:0},sick:false,logs:{},mode:'day',boss:{passed:{}},recoveryDay:0};
const old=JSON.parse(localStorage.getItem('system-v1')||'null');
const S=old?Object.assign(defaultState,old):defaultState;
S.boss=S.boss||{passed:{}}; S.boss.passed=S.boss.passed||{}; S.mode=S.mode||'day'; S.recoveryDay=S.recoveryDay||0;

const save=()=>localStorage.setItem('system-v1',JSON.stringify(S));
const $=id=>document.getElementById(id);

function requirements(l){
  let steps=l<=5?3000:l<=10?4000:l<=15?5000:l<=20?6000:l<=25?7000:l<=30?8000:l<=35?9000:10000;
  let read=l<=5?15:l<=10?20:l<=15?25:30;
  return{steps,read,trading:l>=21?60:0}
}
function currentPlan(){return plans[((S.level-1)%5)+1]}
function blockStart(){return Math.floor((S.level-1)/5)*5+1}
function show(id,on){$(id).classList.toggle('hidden',!on)}

function render(){
  document.body.classList.toggle('sick',S.sick);
  const l=S.level,r=requirements(l),p=currentPlan(),bs=blockStart(),day=l-bs+1,log=S.logs[l]||{};
  $('level').textContent=l;
  $('phase').textContent=l<=60?'BUILD THE SYSTEM':'LIVE THE SYSTEM';
  $('blockProgress').style.width=(Math.min(day-1,5)/5*100)+'%';
  $('checkpoint').textContent=`Checkpoint LV${S.checkpoint} · Block ${bs}–${Math.min(bs+4,365)}`;
  $('modeBtn').textContent=S.sick?'SICK MODE ON':'SICK / INJURY';
  $('stats').innerHTML=Object.entries(S.stats).map(([k,v])=>`<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('');

  const dayMode=S.mode==='day', bossMode=S.mode==='boss', recoveryMode=S.mode==='recovery';
  show('mainPanel',dayMode); show('trainingPanel',dayMode); show('bonusPanel',dayMode);
  show('completeDay',dayMode); show('missDay',dayMode);
  show('bossPanel',bossMode); show('recoveryPanel',recoveryMode);

  if(dayMode){
    $('dayTitle').textContent=`LV${l} · ${p.focus}`;
    $('dayStatus').textContent='IN PROGRESS';
    $('quests').innerHTML=`<label class="quest"><input type="checkbox" data-q="str" ${log.str?'checked':''}><span><b>Strength · ${p.focus}</b><small>Complete today's training</small></span></label>
<label class="quest"><input type="checkbox" data-q="steps" ${log.steps?'checked':''}><span><b>${r.steps.toLocaleString()} steps</b><small>STA main quest</small></span></label>
<label class="quest"><input type="checkbox" data-q="read" ${log.read?'checked':''}><span><b>${r.read} min physical book</b><small>MND main quest · physical book only</small></span></label>
${r.trading?`<label class="quest"><input type="checkbox" data-q="trading" ${log.trading?'checked':''}><span><b>${r.trading} min Trading Study</b><small>New strategies, ideas or structured learning</small></span></label>`:''}`;
    $('workout').innerHTML=p.ex.map((x,i)=>`<div class="exercise"><b>${x[0]} · ${x[1]}</b><div class="sets"><input data-ex="${i}-kg" placeholder="kg / load" value="${log['e'+i+'kg']||''}"><input data-ex="${i}-reps" placeholder="reps / notes" value="${log['e'+i+'reps']||''}"></div></div>`).join('');
    $('sleep').value=log.sleep||''; $('nutrition').checked=!!log.nutrition;
    document.querySelectorAll('[data-q]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};S.logs[l][e.dataset.q]=e.checked;save()});
    document.querySelectorAll('[data-ex]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};let [i,t]=e.dataset.ex.split('-');S.logs[l]['e'+i+t]=e.value;save()});
  }

  if(bossMode){
    const pass=S.boss.passed;
    $('bossStatus').textContent=Object.values(pass).filter(Boolean).length+'/4 CLEARED';
    const phases=[
      ['STR','Physical assessment based on this block'],
      ['STA','Conditioning / walking assessment'],
      ['MND','Quiz yourself on what you actually studied'],
      ['DISCIPLINE','Confirm the five-day block was completed honestly']
    ];
    $('bossPhases').innerHTML=phases.map(([k,d])=>`<label class="quest"><input type="checkbox" data-boss="${k}" ${pass[k]?'checked disabled':''}><span><b>${k} PHASE ${pass[k]?'· CLEARED':''}</b><small>${d}</small></span></label>`).join('');
  }

  if(recoveryMode){
    $('recoveryStatus').textContent=`DAY ${S.recoveryDay}/2`;
    $('recoveryQuests').innerHTML=`<div class="quest"><span><b>Recover</b><small>Sleep, light movement, mobility and normal nutrition. No Main Quest penalty.</small></span></div>`;
  }
}

$('modeBtn').onclick=()=>{S.sick=!S.sick;save();render()};
$('sleep').onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].sleep=$('sleep').value;save()};
$('nutrition').onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].nutrition=$('nutrition').checked;save()};

$('completeDay').onclick=()=>{
  if(S.sick){alert('Sick / Injury Mode is active. Progression is protected.');return}
  const r=requirements(S.level),log=S.logs[S.level]||{},needed=['str','steps','read'].concat(r.trading?['trading']:[]);
  if(!needed.every(k=>log[k])){alert('Complete all Main Quests first. Bonus quests do not block progression.');return}
  if(log.completed){alert('This day is already complete.');return}
  log.completed=true; S.logs[S.level]=log;
  S.stats.STR++; S.stats.STA++; S.stats.MND++; S.stats.DIS++; S.stats.WIL++; S.stats.FOC++;
  if(S.level%5===0){
    S.mode='boss'; S.boss={passed:{}}; save(); render();
    alert(`LV${S.level} COMPLETE — DUNGEON UNLOCKED.`);
    return;
  }
  if(S.level<365)S.level++;
  save();render();
};

$('missDay').onclick=()=>{
  if(S.sick){alert('Sick / Injury Mode protects your progression.');return}
  if(!confirm('Log this as a missed required day? You will lose one level, but never fall below your permanent checkpoint.'))return;
  if(S.level>S.checkpoint+1)S.level--;
  else S.level=Math.max(1,S.checkpoint+1);
  save();render();
};

$('clearBoss').onclick=()=>{
  document.querySelectorAll('[data-boss]').forEach(e=>{if(e.checked)S.boss.passed[e.dataset.boss]=true});
  const keys=['STR','STA','MND','DISCIPLINE'];
  if(!keys.every(k=>S.boss.passed[k])){
    save();render();alert('BOSS NOT CLEARED — passed phases are saved. Retrain the weak phase and retry.');
    return;
  }
  S.checkpoint=S.level;
  S.mode='recovery'; S.recoveryDay=1;
  save();render();alert(`DUNGEON CLEARED — CHECKPOINT LV${S.checkpoint} PERMANENT.`);
};

$('completeRecovery').onclick=()=>{
  if(S.recoveryDay===1){S.recoveryDay=2;save();render();return}
  S.recoveryDay=0; S.mode='day';
  if(S.level<365)S.level++;
  save();render();
  alert(S.level>=365?'SYSTEM COMPLETE — LV365':'RECOVERY COMPLETE — NEXT BLOCK UNLOCKED.');
};

if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
render();
