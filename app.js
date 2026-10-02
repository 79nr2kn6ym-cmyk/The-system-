const plans={
1:{focus:'CHEST',ex:[['Chest Press','3 × 8–12'],['Incline Dumbbell Press','3 × 8–12'],['Cable Fly','2 × 12–15']]},
2:{focus:'BACK',ex:[['Lat Pulldown','3 × 8–12'],['Seated Cable Row','3 × 8–12'],['Chest-Supported Row','2 × 10–12']]},
3:{focus:'LEGS',ex:[['Leg Press','3 × 8–12'],['Leg Curl','3 × 10–15'],['Leg Extension','2 × 10–15'],['Calf Raises','3 × 12–15']]},
4:{focus:'SHOULDERS',ex:[['Shoulder Press','3 × 8–12'],['Lateral Raises','3 × 12–15'],['Reverse Fly','3 × 12–15']]},
5:{focus:'ARMS',ex:[['Dumbbell Curl','3 × 8–12'],['Hammer Curl','2 × 10–12'],['Triceps Pushdown','3 × 8–12'],['Overhead Triceps Extension','2 × 10–12']]}}
const KEY='system-v1';
const S=JSON.parse(localStorage.getItem(KEY)||'null')||{level:1,checkpoint:0,stats:{STR:0,STA:0,MND:0,WIL:0,FOC:0,DIS:0},sick:false,logs:{}};
S.stats=S.stats||{STR:0,STA:0,MND:0,WIL:0,FOC:0,DIS:0};S.logs=S.logs||{};S.level=Math.max(1,Math.min(365,S.level||1));S.checkpoint=S.checkpoint||0;
S.weight=S.weight||{start:103,current:103,goal:80};
S.nutritionDays=S.nutritionDays||{};
S.macroTargets=S.macroTargets||{calories:2000,protein:160,netCarbs:25,fat:140,fiber:30,water:2.5};
S.fasting=S.fasting||{selectedHours:0,active:false,startAt:null,totalPoints:0,completed24:0,completed48:0};
// V7 tracks which attribute points came from Main Quest days so optional/bonus rewards are never deducted by punishment.
if(!S.mainQuestStats){
  const fastingPoints=Math.max(0,Number(S.fasting.totalPoints||0));
  S.mainQuestStats={
    STR:Math.max(0,Number(S.stats.STR||0)),
    STA:Math.max(0,Number(S.stats.STA||0)),
    MND:Math.max(0,Number(S.stats.MND||0)),
    DIS:Math.max(0,Number(S.stats.DIS||0)-fastingPoints)
  };
}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
S.calendar=S.calendar||{};
const dateKey=(d=new Date())=>{let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const parseDate=s=>{let [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{let d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)};
const daysBetween=(a,b)=>Math.round((parseDate(b)-parseDate(a))/86400000);
function requirements(l){let steps=l<=5?3000:l<=10?4000:l<=15?5000:l<=20?6000:l<=25?7000:l<=30?8000:l<=35?9000:10000;let read=l<=5?15:l<=10?20:l<=15?25:30;return{steps,read,trading:l>=21?60:0}}
function currentPlan(){let d=((S.level-1)%5)+1;return plans[d]}
function reconcileMissedDays(){
  const today=dateKey();
  // Migration safety: existing users start V4 today; V4 will never invent penalties for days before this version.
  if(!S.v4StartedOn){S.v4StartedOn=today;S.penaltyProcessedThrough=addDays(today,-1);save()}
  if(!S.penaltyProcessedThrough){S.penaltyProcessedThrough=addDays(today,-1);save()}
  const yesterday=addDays(today,-1);
  if(daysBetween(S.penaltyProcessedThrough,yesterday)<=0)return;
  let cursor=addDays(S.penaltyProcessedThrough,1),lost=0;
  while(daysBetween(cursor,yesterday)>=0){
    const day=S.calendar?.[cursor];
    const protectedDay=day?.completed||day?.protected;
    if(!protectedDay && S.level>S.checkpoint){
      S.level--;lost++;
      // A missed Main Quest day reverses one day of Main-Quest attribute progress.
      // Bonus/optional rewards (for example Fasting Challenge WIL/DIS) are kept.
      ['STR','STA','MND','DIS'].forEach(stat=>{
        if((S.mainQuestStats[stat]||0)>0){
          S.mainQuestStats[stat]--;
          S.stats[stat]=Math.max(0,(S.stats[stat]||0)-1);
        }
      });
    }
    cursor=addDays(cursor,1);
  }
  S.penaltyProcessedThrough=yesterday;save();
  if(lost) setTimeout(()=>alert(`SYSTEM CONSEQUENCE\n${lost} missed Main Quest day${lost>1?'s':''}: -${lost} LV\n-${lost} Main Quest attribute point${lost>1?'s':''} from STR · STA · MND · DIS\nOptional/bonus points are protected.\nCheckpoint protection: LV${S.checkpoint}`),150);
}
function render(){
 document.body.classList.toggle('sick',S.sick);let l=S.level,r=requirements(l),p=currentPlan(),blockStart=Math.floor((l-1)/5)*5+1,day=(l-blockStart)+1;
 level.textContent=l;phase.textContent=l<=60?'BUILD THE SYSTEM':'LIVE THE SYSTEM';blockProgress.style.width=((day-1)/5*100)+'%';checkpoint.textContent=`Checkpoint LV${S.checkpoint} · Block ${blockStart}–${Math.min(blockStart+4,365)}`;dayTitle.textContent=`LV${l} · ${p.focus}`;modeBtn.textContent=S.sick?'SICK MODE ON':'SICK / INJURY';stats.innerHTML=Object.entries(S.stats).map(([k,v])=>`<div class=stat><small>${k}</small><b>${v}</b></div>`).join('');
 let log=S.logs[l]||{};quests.innerHTML=`<label class=quest><input type=checkbox data-q=str ${log.str?'checked':''}><span><b>Strength · ${p.focus}</b><small>Complete today's training</small></span></label><label class=quest><input type=checkbox data-q=steps ${log.steps?'checked':''}><span><b>${r.steps.toLocaleString()} steps</b><small>STA main quest</small></span></label><label class=quest><input type=checkbox data-q=read ${log.read?'checked':''}><span><b>${r.read} min physical book</b><small>MND main quest · physical book only</small></span></label>${r.trading?`<label class=quest><input type=checkbox data-q=trading ${log.trading?'checked':''}><span><b>${r.trading} min Trading Study</b><small>New strategies, ideas or structured learning</small></span></label>`:''}`;
 workout.innerHTML=p.ex.map((x,i)=>`<div class=exercise><b>${x[0]} · ${x[1]}</b><div class=sets><input data-ex='${i}-kg' placeholder='kg / load' value='${log['e'+i+'kg']||''}'><input data-ex='${i}-reps' placeholder='reps / notes' value='${log['e'+i+'reps']||''}'></div></div>`).join('');sleep.value=log.sleep||'';nutrition.checked=!!log.nutrition;
 const todayState=S.calendar?.[dateKey()];dayStatus.textContent=S.sick?'PROTECTED':todayState?.completed?'COMPLETED · RESET 00:00':'IN PROGRESS · RESET 00:00';
 document.querySelectorAll('[data-q]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};S.logs[l][e.dataset.q]=e.checked;save()});document.querySelectorAll('[data-ex]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};let [i,t]=e.dataset.ex.split('-');S.logs[l]['e'+i+t]=e.value;save()})
}

const macroDefs=[['calories','Calories','kcal'],['protein','Protein','g'],['netCarbs','Net Carbs','g'],['fat','Fat','g'],['fiber','Fiber','g'],['water','Water','L']];
function nutritionToday(){const k=dateKey();S.nutritionDays[k]=S.nutritionDays[k]||{calories:0,protein:0,netCarbs:0,fat:0,fiber:0,water:0,electrolyteGrams:0};return S.nutritionDays[k]}
function renderWeightAndMacros(){
 const w=S.weight||{start:103,current:103,goal:80};weightStart.value=w.start;weightCurrent.value=w.current;weightGoal.value=w.goal;
 const total=Math.abs(Number(w.start)-Number(w.goal)),done=Math.max(0,Math.min(total,Math.abs(Number(w.start)-Number(w.current)))),pct=total?Math.round(done/total*100):0;
 weightPct.textContent=`${pct}% REACHED`;weightBar.style.width=pct+'%';const rem=Math.max(0,Math.abs(Number(w.current)-Number(w.goal)));weightRemaining.textContent=`${rem.toFixed(1)} kg remaining`;
 const day=nutritionToday();macroGrid.innerHTML=macroDefs.map(([k,label,unit])=>{const v=Number(day[k]||0),t=Number(S.macroTargets[k]||0),pc=t?Math.min(100,Math.round(v/t*100)):0;return `<div class='macroItem'><div class='macroTop'><b>${label}</b><span>${v} / ${t} ${unit}</span></div><div class='macroInputs'><label>Today<input type='number' step='${k==='water'?'.1':'1'}' min='0' data-macro='${k}' value='${v}'></label><label>Target<input type='number' step='${k==='water'?'.1':'1'}' min='0' data-target='${k}' value='${t}'></label></div><div class='miniProgress'><i style='width:${pc}%'></i></div></div>`}).join('');
 electrolyteGrams.value=day.electrolyteGrams||'';const g=Math.max(0,Number(day.electrolyteGrams||0)),factor=g/5;electrolyteTotals.innerHTML=`<span>Na ${Math.round(430*factor)} mg · K ${Math.round(180*factor)} mg · Mg ${Math.round(94*factor)} mg</span><span>${g} g logged</span>`;
 document.querySelectorAll('[data-macro]').forEach(e=>e.onchange=()=>{nutritionToday()[e.dataset.macro]=Math.max(0,Number(e.value||0));save();renderWeightAndMacros()});
 document.querySelectorAll('[data-target]').forEach(e=>e.onchange=()=>{S.macroTargets[e.dataset.target]=Math.max(0,Number(e.value||0));save();renderWeightAndMacros()});
}
[weightStart,weightCurrent,weightGoal].forEach((e,i)=>e.onchange=()=>{const keys=['start','current','goal'];S.weight[keys[i]]=Number(e.value||0);save();renderWeightAndMacros()});
electrolyteGrams.onchange=()=>{nutritionToday().electrolyteGrams=Math.max(0,Number(electrolyteGrams.value||0));save();renderWeightAndMacros()};

modeBtn.onclick=()=>{S.sick=!S.sick;S.calendar=S.calendar||{};S.calendar[dateKey()]=S.calendar[dateKey()]||{};S.calendar[dateKey()].protected=S.sick;save();render()};
sleep.onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].sleep=sleep.value;save()};nutrition.onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].nutrition=nutrition.checked;save()};
completeDay.onclick=()=>{
 if(S.sick){alert('Sick / Injury Mode is active. Today is protected and progression is paused.');return}
 const today=dateKey();S.calendar=S.calendar||{};if(S.calendar[today]?.completed){alert('DAILY LIMIT REACHED\nYou can gain only 1 Player Level per calendar day.\nNext progression unlocks at 00:00.');return}
 let r=requirements(S.level),log=S.logs[S.level]||{},needed=['str','steps','read'].concat(r.trading?['trading']:[]);if(!needed.every(k=>log[k])){alert('Complete all Main Quests first. Bonus quests do not block progression.');return}
 ['STR','STA','MND','DIS'].forEach(stat=>{S.stats[stat]=(S.stats[stat]||0)+1;S.mainQuestStats[stat]=(S.mainQuestStats[stat]||0)+1});S.calendar[today]={...(S.calendar[today]||{}),completed:true,level:S.level,completedAt:new Date().toISOString()};
 if(S.level%5===0){S.checkpoint=S.level;alert(`BLOCK COMPLETE — LV${S.level}\nCheckpoint LV${S.level} permanently secured.`)}
 if(S.level<365)S.level++;S.penaltyProcessedThrough=today;save();render()
};

let fastTick=null;
function formatDuration(ms){
 const total=Math.max(0,Math.floor(ms/1000)),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
 return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function renderFast(){
 const f=S.fasting,targetMs=(Number(f.selectedHours)||0)*3600000,elapsed=f.active&&f.startAt?Math.max(0,Date.now()-f.startAt):0;
 const pct=targetMs?Math.min(100,elapsed/targetMs*100):0,complete=!!(f.active&&targetMs&&elapsed>=targetMs);
 document.querySelectorAll('[data-fast-hours]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.fastHours)===Number(f.selectedHours));b.disabled=!!f.active});
 fastTimer.textContent=f.active?formatDuration(elapsed):'00:00:00';
 fastTarget.textContent=f.selectedHours?`${f.selectedHours}H CHALLENGE${f.active?' · RUNNING':''}`:'SELECT 24H OR 48H';
 fastBar.style.width=pct+'%';fastPct.textContent=`${Math.floor(pct)}% COMPLETE`;fastPoints.textContent=`${f.totalPoints||0} CHALLENGE POINT${(f.totalPoints||0)===1?'':'S'}`;
 startFast.disabled=!f.selectedHours||f.active;endFast.disabled=!f.active;claimFast.hidden=!complete;startFast.hidden=complete;
}
document.querySelectorAll('[data-fast-hours]').forEach(b=>b.onclick=()=>{if(S.fasting.active)return;S.fasting.selectedHours=Number(b.dataset.fastHours);save();renderFast()});
startFast.onclick=()=>{if(!S.fasting.selectedHours||S.fasting.active)return;S.fasting.active=true;S.fasting.startAt=Date.now();save();renderFast()};
endFast.onclick=()=>{if(!S.fasting.active)return;if(confirm('End this fasting challenge? There is no penalty.')){S.fasting.active=false;S.fasting.startAt=null;S.fasting.selectedHours=0;save();renderFast()}};
claimFast.onclick=()=>{const f=S.fasting,targetMs=Number(f.selectedHours)*3600000;if(!f.active||!f.startAt||Date.now()-f.startAt<targetMs)return;const reward=f.selectedHours===48?2:1;f.totalPoints=(f.totalPoints||0)+reward;if(f.selectedHours===48)f.completed48=(f.completed48||0)+1;else f.completed24=(f.completed24||0)+1;S.stats.WIL=(S.stats.WIL||0)+reward;S.stats.DIS=(S.stats.DIS||0)+reward;f.active=false;f.startAt=null;f.selectedHours=0;save();render();renderFast();alert(`FASTING CHALLENGE COMPLETE\n+${reward} WIL · +${reward} DIS`)};
fastTick=setInterval(renderFast,1000);

reconcileMissedDays();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');render();renderWeightAndMacros();renderFast();
