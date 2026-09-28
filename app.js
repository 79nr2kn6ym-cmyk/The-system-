const plans={
1:{focus:'CHEST',ex:[['Chest Press','3 × 8–12'],['Incline Dumbbell Press','3 × 8–12'],['Cable Fly','2 × 12–15']]},
2:{focus:'BACK',ex:[['Lat Pulldown','3 × 8–12'],['Seated Cable Row','3 × 8–12'],['Chest-Supported Row','2 × 10–12']]},
3:{focus:'LEGS',ex:[['Leg Press','3 × 8–12'],['Leg Curl','3 × 10–15'],['Leg Extension','2 × 10–15'],['Calf Raises','3 × 12–15']]},
4:{focus:'SHOULDERS',ex:[['Shoulder Press','3 × 8–12'],['Lateral Raises','3 × 12–15'],['Reverse Fly','3 × 12–15']]},
5:{focus:'ARMS',ex:[['Dumbbell Curl','3 × 8–12'],['Hammer Curl','2 × 10–12'],['Triceps Pushdown','3 × 8–12'],['Overhead Triceps Extension','2 × 10–12']]}}
const KEY='system-v1';
const S=JSON.parse(localStorage.getItem(KEY)||'null')||{level:1,checkpoint:0,stats:{STR:0,STA:0,MND:0,WIL:0,FOC:0,DIS:0},sick:false,logs:{}};
S.stats=S.stats||{STR:0,STA:0,MND:0,WIL:0,FOC:0,DIS:0};S.logs=S.logs||{};S.level=Math.max(1,Math.min(365,S.level||1));S.checkpoint=S.checkpoint||0;
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const dateKey=(d=new Date())=>{let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const parseDate=s=>{let [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{let d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)};
const daysBetween=(a,b)=>Math.round((parseDate(b)-parseDate(a))/86400000);
function requirements(l){let steps=l<=5?3000:l<=10?4000:l<=15?5000:l<=20?6000:l<=25?7000:l<=30?8000:l<=35?9000:10000;let read=l<=5?15:l<=10?20:l<=15?25:30;return{steps,read,trading:l>=21?60:0}}
function currentPlan(){let d=((S.level-1)%5)+1;return plans[d]}
function reconcileMissedDays(){
  const today=dateKey();
  if(!S.penaltyProcessedThrough){S.penaltyProcessedThrough=today;save();return}
  const yesterday=addDays(today,-1);
  if(daysBetween(S.penaltyProcessedThrough,yesterday)<=0)return;
  let cursor=addDays(S.penaltyProcessedThrough,1),lost=0;
  while(daysBetween(cursor,yesterday)>=0){
    const day=S.calendar?.[cursor];
    const protectedDay=day?.completed||day?.protected;
    if(!protectedDay && S.level>S.checkpoint){S.level--;lost++}
    cursor=addDays(cursor,1);
  }
  S.penaltyProcessedThrough=yesterday;save();
  if(lost) setTimeout(()=>alert(`SYSTEM CONSEQUENCE\n${lost} missed progression day${lost>1?'s':''}: -${lost} LV\nCheckpoint protection: LV${S.checkpoint}`),150);
}
function render(){
 document.body.classList.toggle('sick',S.sick);let l=S.level,r=requirements(l),p=currentPlan(),blockStart=Math.floor((l-1)/5)*5+1,day=(l-blockStart)+1;
 level.textContent=l;phase.textContent=l<=60?'BUILD THE SYSTEM':'LIVE THE SYSTEM';blockProgress.style.width=((day-1)/5*100)+'%';checkpoint.textContent=`Checkpoint LV${S.checkpoint} · Block ${blockStart}–${Math.min(blockStart+4,365)}`;dayTitle.textContent=`LV${l} · ${p.focus}`;modeBtn.textContent=S.sick?'SICK MODE ON':'SICK / INJURY';stats.innerHTML=Object.entries(S.stats).map(([k,v])=>`<div class=stat><small>${k}</small><b>${v}</b></div>`).join('');
 let log=S.logs[l]||{};quests.innerHTML=`<label class=quest><input type=checkbox data-q=str ${log.str?'checked':''}><span><b>Strength · ${p.focus}</b><small>Complete today's training</small></span></label><label class=quest><input type=checkbox data-q=steps ${log.steps?'checked':''}><span><b>${r.steps.toLocaleString()} steps</b><small>STA main quest</small></span></label><label class=quest><input type=checkbox data-q=read ${log.read?'checked':''}><span><b>${r.read} min physical book</b><small>MND main quest · physical book only</small></span></label>${r.trading?`<label class=quest><input type=checkbox data-q=trading ${log.trading?'checked':''}><span><b>${r.trading} min Trading Study</b><small>New strategies, ideas or structured learning</small></span></label>`:''}`;
 workout.innerHTML=p.ex.map((x,i)=>`<div class=exercise><b>${x[0]} · ${x[1]}</b><div class=sets><input data-ex='${i}-kg' placeholder='kg / load' value='${log['e'+i+'kg']||''}'><input data-ex='${i}-reps' placeholder='reps / notes' value='${log['e'+i+'reps']||''}'></div></div>`).join('');sleep.value=log.sleep||'';nutrition.checked=!!log.nutrition;
 const todayState=S.calendar?.[dateKey()];dayStatus.textContent=S.sick?'PROTECTED':todayState?.completed?'COMPLETED':'IN PROGRESS';
 document.querySelectorAll('[data-q]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};S.logs[l][e.dataset.q]=e.checked;save()});document.querySelectorAll('[data-ex]').forEach(e=>e.onchange=()=>{S.logs[l]=S.logs[l]||{};let [i,t]=e.dataset.ex.split('-');S.logs[l]['e'+i+t]=e.value;save()})
}
modeBtn.onclick=()=>{S.sick=!S.sick;S.calendar=S.calendar||{};S.calendar[dateKey()]=S.calendar[dateKey()]||{};S.calendar[dateKey()].protected=S.sick;save();render()};
sleep.onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].sleep=sleep.value;save()};nutrition.onchange=()=>{S.logs[S.level]=S.logs[S.level]||{};S.logs[S.level].nutrition=nutrition.checked;save()};
completeDay.onclick=()=>{
 if(S.sick){alert('Sick / Injury Mode is active. Today is protected and progression is paused.');return}
 const today=dateKey();S.calendar=S.calendar||{};if(S.calendar[today]?.completed){alert('Today is already completed. One Player Level maximum per progression day.');return}
 let r=requirements(S.level),log=S.logs[S.level]||{},needed=['str','steps','read'].concat(r.trading?['trading']:[]);if(!needed.every(k=>log[k])){alert('Complete all Main Quests first. Bonus quests do not block progression.');return}
 S.stats.STR++;S.stats.STA++;S.stats.MND++;S.stats.DIS++;S.calendar[today]={...(S.calendar[today]||{}),completed:true,level:S.level};
 if(S.level%5===0){S.checkpoint=S.level;alert(`BLOCK COMPLETE — LV${S.level}\nCheckpoint LV${S.level} permanently secured.`)}
 if(S.level<365)S.level++;S.penaltyProcessedThrough=today;save();render()
};
reconcileMissedDays();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');render();
