import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BookOpen, Check, ChevronRight, CircleHelp, Download, LockKeyhole, Plus, RotateCcw, Settings2, Sparkles, Star, Upload, X, Timer, Trophy, RefreshCw, Gamepad2 } from 'lucide-react'
import { cloudConfigured, supabase } from './supabase'
import { buildDailyTasks, type LearningTask } from './curriculum'

type Lesson = LearningTask
type Saved = { done: number[]; taskDone: Record<string, number[]>; custom: Lesson[]; stars: number; medals: number }
const KEY = 'number-nest-v1'
const readSaved = (): Saved => { try { const value=JSON.parse(localStorage.getItem(KEY) || ''); return { done:Array.isArray(value.done)?value.done:[], taskDone:value.taskDone&&typeof value.taskDone==='object'?value.taskDone:{}, custom:Array.isArray(value.custom)?value.custom:[], stars:Number(value.stars)||0, medals:Number(value.medals)||0 } } catch { return { done: [], taskDone:{}, custom: [], stars: 0, medals:0 } } }

type RaceQuestion = { prompt: string; choices: string[]; answer: string }
type Race = { positions: [number,number]; turn: number; question: RaceQuestion; seconds: number; status: 'ready'|'playing'|'won'; message: string }
function makeRaceQuestion(): RaceQuestion {
  const a=2+Math.floor(Math.random()*19), b=1+Math.floor(Math.random()*Math.min(a,9))
  const subtract=Math.random()<.35, answer=subtract?a-b:a+b
  const values=[answer];for(let offset=1;values.length<4;offset++){const candidate=answer+offset;if(candidate!==answer)values.push(candidate)}
  const choices=values.map(String)
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}
  return {prompt:`${a} ${subtract?'−':'+'} ${b} = ?`,choices,answer:String(answer)}
}
const newRace=():Race=>({positions:[0,0],turn:0,question:makeRaceQuestion(),seconds:5,status:'ready',message:'Take turns. A correct answer moves one step toward the treasure!'})

const lessons: Lesson[] = [
  ['Count to 30','Number sense','How many dots are there?  ● ● ● ● ●  ● ● ● ●','8','10','9','9','Count each dot once.','🔢','#e8edff'],
  ['Before and after','Counting','What number comes just before 17?','15','16','18','16','Count backwards one step from 17.','🪜','#fff0de'],
  ['Groups of five','Counting','There are 3 groups of 5. How many altogether?','8','10','15','15','Count 5, 10, 15.','🧸','#e5f8ee'],
  ['Which is bigger?','Comparing','Which number is bigger: 18 or 23?','18','23','They are the same','23','Compare the tens first.','⚖️','#fce8ef'],
  ['Count by twos','Patterns','What comes next? 2, 4, 6, 8, __','9','10','12','10','Each step adds 2.','🟣','#eee8ff'],
  ['Make ten','Number bonds','6 + __ = 10','3','4','5','4','How many more does 6 need to reach 10?','🧩','#fff4d9'],
  ['Week one review','Review','Which pair makes 10?','6 + 3','7 + 3','5 + 4','7 + 3','Try each pair by counting on.','🎉','#e5f8ee'],
  ['Add within ten','Addition','What is 3 + 4?','6','7','8','7','Start at 3 and count four more.','➕','#e8edff'],
  ['Add within twenty','Addition','What is 8 + 5?','12','13','14','13','Make ten first: 8 needs 2.','🌈','#fff0de'],
  ['Make ten first','Mental maths','What is 9 + 6?','14','15','16','15','Move 1 from 6 to make 9 into 10.','🧠','#e5f8ee'],
  ['Take away','Subtraction','What is 9 − 4?','4','5','6','5','Count back four steps from 9.','🍎','#fce8ef'],
  ['Subtract within twenty','Subtraction','What is 14 − 5?','8','9','10','9','Take 4 to reach 10, then 1 more.','🚀','#eee8ff'],
  ['Find the missing number','Thinking','5 + __ = 9','3','4','5','4','What must you add to 5 to reach 9?','🔍','#fff4d9'],
  ['Play shopkeeper','Everyday maths','A toy costs ₹6 and a ball ₹8. What is the total?','₹12','₹14','₹16','₹14','Add 6 and 8. You can make 10 first.','🏪','#e5f8ee'],
  ['Make a pattern','Patterns','What comes next? 2, 4, 6, 8, __','9','10','12','10','The numbers go up by 2.','🔁','#e8edff'],
  ['Shape hunt','Shapes','Which shape has 3 sides?','Circle','Square','Triangle','Triangle','Count the straight sides.','🔺','#fff0de'],
  ['Odd one out','Reasoning','Which one is different: apple, mango, banana, pencil?','Apple','Mango','Banana','Pencil','Three are fruit.','🕵️','#e5f8ee'],
  ['Same amount?','Number sense','Are 8 blocks still 8 if you spread them farther apart?','Yes','No','Only sometimes','Yes','Moving things does not change how many there are.','🧱','#fce8ef'],
  ['Toy car story','Word problems','You have 7 toy cars and get 5 more. How many now?','11','12','13','12','Join the two groups: 7 + 5.','🚗','#eee8ff'],
  ['Estimate and count','Estimation','About how many fingers are on both your hands?','5','10','20','10','Estimate first, then count your fingers.','✋','#fff4d9'],
  ['Puzzle day','Reasoning','I am bigger than 8 and smaller than 10. What am I?','7','9','11','9','There is one whole number between 8 and 10.','💡','#e5f8ee'],
  ['Pairs to twelve','Addition','Which pair makes 12?','5 + 6','7 + 5','8 + 3','7 + 5','Count on from the larger number.','🎯','#e8edff'],
  ['Count backwards','Subtraction','Start at 20 and go back 2. Where do you land?','17','18','19','18','One step back is 19; another is 18.','⬇️','#fff0de'],
  ['Equal groups','Early multiplication','3 plates have 2 biscuits each. How many biscuits?','5','6','8','6','Add 2 + 2 + 2.','🍪','#e5f8ee'],
  ['Measure a pencil','Measurement','Which is the best tool to measure a pencil?','A ruler','A spoon','A shoe','A ruler','A ruler shows centimetres.','📏','#fce8ef'],
  ['Money game','Everyday maths','₹5 + ₹2 + ₹3 = ?','₹9','₹10','₹11','₹10','Add the rupees together.','🪙','#eee8ff'],
  ['Missing number','Thinking','8 + __ = 14','5','6','7','6','Count up from 8 to 14.','🧩','#fff4d9'],
  ['Make a story','Creative maths','You have 4 toy animals and get 3 more. How many?','6','7','8','7','Add the new animals to the first group.','🦊','#e5f8ee'],
  ['Maths treasure hunt','Review','Which is an even number?','7','9','12','12','Even numbers can be split into pairs.','🏆','#e8edff'],
  ['Celebrate your maths','Review','You finished 30 days of practice. How many days is that?','20','30','40','30','You made it all the way through!','⭐','#fff0de']
].map((d, i) => ({ day: i + 1, title: d[0] as string, topic: d[1] as string, prompt: d[2] as string, choices: [d[3], d[4], d[5]] as string[], answer: d[6] as string, hint: d[7] as string, icon: d[8] as string, color: d[9] as string }))

function App() {
  const [saved, setSaved] = useState<Saved>(readSaved)
  const [selected, setSelected] = useState(1)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [tab, setTab] = useState<'learn'|'parent'|'game'>('learn')
  const [showHint, setShowHint] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ title:'', topic:'Addition', prompt:'', options:'', answer:'', hint:'' })
  const [remoteTasks, setRemoteTasks] = useState<Lesson[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [cloudEmail, setCloudEmail] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudMessage, setCloudMessage] = useState('')
  const [createAccount, setCreateAccount] = useState(false)
  const [race,setRace] = useState<Race>(newRace)
  const [syncingContent,setSyncingContent] = useState(false)
  const [contentUpdated,setContentUpdated] = useState('')
  const allLessons = useMemo(() => [...lessons, ...saved.custom.filter(item => !item.remoteId), ...remoteTasks], [saved.custom, remoteTasks])
  const lesson = allLessons.find(x => x.day === selected) || allLessons[0]
  const dailyQuestions = useMemo(() => buildDailyTasks(lesson), [lesson])
  const question = dailyQuestions[Math.min(questionIndex, dailyQuestions.length - 1)]
  const finishedQuestions = saved.taskDone[String(selected)] || []
  const updateSaved = (next: Saved) => {
    setSaved(next)
    localStorage.setItem(KEY, JSON.stringify(next))
    if (supabase && session) {
      void supabase.from('learning_progress').upsert({ user_id: session.user.id, done_days: next.done, task_progress:next.taskDone, stars: next.stars }, { onConflict: 'user_id' })
        .then(({ error }) => { if (error) setCloudMessage(`Progress stays on this device for now: ${error.message}`) })
    }
  }
  const refreshRemoteTasks = async () => {
    if (!supabase) { setContentUpdated('Offline lessons ready'); return }
    setSyncingContent(true)
    const { data, error } = await supabase.from('learning_tasks').select('id,title,topic,prompt,choices,answer,hint,icon,color').eq('published', true).order('created_at')
    setSyncingContent(false)
    if(error){setCloudMessage(`Cloud lessons are unavailable: ${error.message}`);return}
    const tasks=(data||[]).map((row,index)=>({...row,day:31+saved.custom.filter(item=>!item.remoteId).length+index,choices:row.choices as string[]}))
    setRemoteTasks(tasks)
    setContentUpdated(`Updated ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`)
  }
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!supabase) return
    void refreshRemoteTasks()
    const interval=window.setInterval(()=>void refreshRemoteTasks(),60_000)
    const onFocus=()=>void refreshRemoteTasks()
    const onVisible=()=>{if(document.visibilityState==='visible')void refreshRemoteTasks()}
    window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisible)
    return ()=>{window.clearInterval(interval);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisible)}
  }, [saved.custom.length, session])
  useEffect(()=>{
    if(tab!=='game'||race.status!=='playing')return
    const interval=window.setInterval(()=>setRace(current=>{
      if(current.status!=='playing')return current
      if(current.seconds>1)return {...current,seconds:current.seconds-1}
      const positions:[number,number]=[...current.positions];positions[current.turn]=0
      return {...current,positions,turn:1-current.turn,question:makeRaceQuestion(),seconds:5,message:`Time’s up! Player ${current.turn+1} goes back to start. Player ${2-current.turn}, your turn.`}
    }),1000)
    return()=>window.clearInterval(interval)
  },[tab,race.status])
  useEffect(() => {
    if (!supabase || !session) return
    void supabase.from('learning_progress').select('done_days,task_progress,stars').eq('user_id', session.user.id).maybeSingle().then(({ data, error }) => {
      if (error) { setCloudMessage(`Progress could not be loaded: ${error.message}`); return }
      if (data) {
        const local=readSaved()
        const cloudTaskDone=data.task_progress&&typeof data.task_progress==='object'?data.task_progress as Record<string,number[]>:{}
        const taskDone:Record<string,number[]>={...local.taskDone}
        for(const [day,indices] of Object.entries(cloudTaskDone)) taskDone[day]=Array.from(new Set([...(taskDone[day]||[]),...(Array.isArray(indices)?indices:[])]))
        const next: Saved = { ...local, done:Array.from(new Set<number>([...local.done,...(data.done_days || []).map(Number)])), taskDone, stars:Math.max(local.stars,Number(data.stars || 0)) }
        setSaved(next)
        localStorage.setItem(KEY, JSON.stringify(next))
        void supabase?.from('learning_progress').upsert({user_id:session.user.id,done_days:next.done,task_progress:next.taskDone,stars:next.stars},{onConflict:'user_id'})
      } else {
        void supabase?.from('learning_progress').insert({ user_id:session.user.id, done_days:saved.done, task_progress:saved.taskDone, stars:saved.stars })
      }
    })
  }, [session])
  const progress = Math.round(saved.done.length / 30 * 100)
  const answerRace=(choice:string)=>{
    const current=race;if(current.status!=='playing')return
    const positions:[number,number]=[...current.positions]
    if(choice!==current.question.answer){positions[current.turn]=0;setRace({...current,positions,turn:1-current.turn,question:makeRaceQuestion(),seconds:5,message:`Not quite! Player ${current.turn+1} goes back to start. Player ${2-current.turn}, your turn.`});return}
    positions[current.turn]=Math.min(5,positions[current.turn]+1)
    if(positions[current.turn]===5){setRace({...current,positions,status:'won',message:`Player ${current.turn+1} reached the treasure and won a medal!`});updateSaved({...saved,medals:saved.medals+1,stars:saved.stars+10});return}
    setRace({...current,positions,turn:1-current.turn,question:makeRaceQuestion(),seconds:5,message:`Great answer! Player ${2-current.turn}, your turn.`})
  }
  const resetRace=()=>setRace(newRace())
  const choose = (value: string) => {
    if (answer) return
    setAnswer(value)
    if (value !== question.answer || lesson.day > 30 || finishedQuestions.includes(questionIndex)) return
    const nextDayProgress=[...finishedQuestions,questionIndex]
    const dayComplete=nextDayProgress.length===25
    updateSaved({ ...saved, taskDone:{...saved.taskDone,[String(selected)]:nextDayProgress}, done:dayComplete?[...new Set([...saved.done,selected])]:saved.done, stars:saved.stars+1 })
  }
  const startDay = (day: number) => {
    const count=day<=30?25:1
    const done=saved.taskDone[String(day)]||[]
    const first=Array.from({length:count},(_,index)=>index).find(index=>!done.includes(index))
    setSelected(day); setQuestionIndex(first??count-1); setAnswer(''); setShowHint(false); setTab('learn'); window.scrollTo({top:0,behavior:'smooth'})
  }
  const nextQuestion = () => {
    if (answer !== question.answer) return
    if (questionIndex < dailyQuestions.length - 1) { setQuestionIndex(questionIndex + 1); setAnswer(''); setShowHint(false) }
    else if (selected < allLessons.length) startDay(selected + 1)
  }
  const exportJson = () => { const blob = new Blob([JSON.stringify(saved.custom,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='number-nest-tasks.json'; a.click(); URL.revokeObjectURL(url) }
  const importJson = async (file?: File) => { if (!file) return; try { const items=JSON.parse(await file.text()); if (!Array.isArray(items)) throw new Error(); updateSaved({...saved,custom:[...saved.custom,...items]}); setNotice(`Imported ${items.length} task(s).`) } catch { setNotice('That file is not a valid task JSON array.') } }
  const addTask = () => { const opts=draft.options.split(',').map(s=>s.trim()).filter(Boolean); if(!draft.title||!draft.prompt||opts.length<2||!opts.includes(draft.answer)){setNotice('Add a title, question, at least two comma-separated choices, and an answer that matches one choice.');return} const item:Lesson={day:31+saved.custom.length,title:draft.title,topic:draft.topic,prompt:draft.prompt,choices:opts.slice(0,4),answer:draft.answer,hint:draft.hint||'Think it through one step at a time.',icon:'✨',color:'#e8edff'}; updateSaved({...saved,custom:[...saved.custom,item]});setDraft({title:'',topic:'Addition',prompt:'',options:'',answer:'',hint:''});setNotice('Task saved on this device and ready to try.') }
  const authenticateParent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    const result = createAccount
      ? await supabase.auth.signUp({ email:cloudEmail, password:cloudPassword, options:{ emailRedirectTo:window.location.href } })
      : await supabase.auth.signInWithPassword({ email:cloudEmail, password:cloudPassword })
    if (result.error) { setCloudMessage(result.error.message); return }
    setCloudMessage(createAccount ? 'Account created. If email confirmation is enabled, check your inbox, then sign in.' : 'Signed in. Progress will sync on this account.')
    if (result.data.session) setSession(result.data.session)
  }
  const publishTask = async (item: Lesson) => {
    if (!supabase || !session) { setCloudMessage('Sign in as a parent before publishing.'); return }
    if (item.remoteId) { setCloudMessage('This task is already published.'); return }
    const { data, error } = await supabase.from('learning_tasks').insert({ owner_id:session.user.id, title:item.title, topic:item.topic, prompt:item.prompt, choices:item.choices, answer:item.answer, hint:item.hint, icon:item.icon, color:item.color, published:true }).select('id').single()
    if (error) { setCloudMessage(`Could not publish task: ${error.message}`); return }
    const next={...saved,custom:saved.custom.map(task=>task===item?{...task,remoteId:data.id}:task)}
    setSaved(next); localStorage.setItem(KEY,JSON.stringify(next)); setCloudMessage('Published. The task is available to signed-in devices and visitors.')
  }
  const signOutParent = async () => { if (!supabase) return; const { error }=await supabase.auth.signOut(); setCloudMessage(error?.message || 'Signed out.') }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={()=>setTab('learn')}><span className="brand-mark">✳</span><span>number<span className="brand-light">nest</span></span></a><div className="top-actions"><span className="streak"><Star size={16} fill="currentColor"/> {saved.stars} stars</span><button className={`parent-button ${tab==='game'?'active':''}`} onClick={()=>setTab('game')}><Gamepad2 size={16}/><span>2-player game</span></button><button className={`parent-button ${tab==='parent'?'active':''}`} onClick={()=>setTab(tab==='parent'?'learn':'parent')}><LockKeyhole size={16}/><span>Parent area</span></button></div></header>
    {tab==='learn'?<>
      <main className="main-grid">
        <section className="welcome"><div className="welcome-copy"><span className="eyebrow"><Sparkles size={14}/> YOUR LITTLE MATHS ADVENTURE</span><h1>Small steps.<br/><span>Big bright thinking.</span></h1><p>Fun maths practice, one day at a time. Think it through, try your best, and enjoy the “aha!” moments.</p><div className="welcome-tags"><span>🌱 No rush</span><span>🧠 Think your way</span><span>✨ Celebrate trying</span></div></div><div className="hero-art"><div className="hero-sun">☀️</div><div className="hero-kid">🧒🏻</div><div className="hero-book">📘</div><div className="hero-star">⭐</div><div className="hero-math">2 + 3 = ?</div></div></section>
        <section className="content-grid"><aside className="journey-card"><div className="journey-head"><div><span className="eyebrow">YOUR JOURNEY</span><h2>30-day maths path</h2></div><span className="progress-count">{saved.done.length}<small>/30</small></span></div><div className="progress-track"><i style={{width:`${progress}%`}}/></div><p className="progress-caption">{progress===100?'Amazing! You finished your first adventure.':`${progress}% complete · A little practice adds up!`}</p><div className="day-list">{allLessons.map((item,i)=><button key={`${item.day}-${item.title}`} onClick={()=>startDay(item.day)} className={`day-row ${selected===item.day?'selected':''} ${item.day>30?'extra':''}`}><span className="day-icon" style={{background:item.color}}>{saved.done.includes(item.day)?<Check size={17}/>:item.icon}</span><span className="day-label"><b>{item.day>30?'Bonus':`Day ${String(item.day).padStart(2,'0')}`}</b><small>{item.title}</small>{item.day<=30&&<em>{(saved.taskDone[String(item.day)]||[]).length}/25 tasks</em>}</span><span className="day-state">{saved.done.includes(item.day)?'✓':selected===item.day?'›':'·'}</span></button>)}</div><div className="journey-foot"><BookOpen size={15}/> 25 friendly questions each day</div></aside>
          <section className="lesson-column"><div className="today-label"><button className="content-refresh" onClick={()=>void refreshRemoteTasks()} disabled={syncingContent}><RefreshCw size={15}/>{syncingContent?'Checking lessons':contentUpdated||'Check for new lessons'}</button><span className="today-dot"/> {lesson.day<=30?`DAY ${lesson.day} · ${lesson.topic.toUpperCase()}`:`BONUS TASK · ${lesson.topic.toUpperCase()}`}<span className="today-stars">{lesson.day<=30?`${finishedQuestions.length}/25 tasks`:'Bonus task'}{saved.done.includes(lesson.day)?' · ⭐ Day done':''}</span></div><article className="lesson-card"><div className="lesson-card-top"><div className="lesson-art" style={{background:question.color}}>{question.icon}</div><div><span className="lesson-kicker">QUESTION {questionIndex+1} OF {dailyQuestions.length}</span><h2>{question.title}</h2></div><span className="spark">✦</span></div>{lesson.day<=30&&<div className="question-meter"><div className="progress-track"><i style={{width:`${Math.round(finishedQuestions.length/25*100)}%`}}/></div><span>{finishedQuestions.length} of 25 questions completed today</span></div>}<div className="question-box"><p>{question.prompt}</p></div><div className="answer-list">{question.choices.map((choice,i)=><button key={i} disabled={!!answer} onClick={()=>choose(choice)} className={`answer-option ${answer===choice?(choice===question.answer?'correct':'wrong'):answer&&choice===question.answer?'reveal':''}`}><span className="choice-letter">{String.fromCharCode(65+i)}</span><span>{choice}</span>{answer===choice&&choice===question.answer&&<Check size={20}/>}</button>)}</div>{answer&&<div className={`feedback ${answer===question.answer?'good':'try-again'}`}><span>{answer===question.answer?'🎉':'💛'}</span><div><b>{answer===question.answer?'You got it!':'Good try!'}</b><p>{answer===question.answer?(lesson.day<=30&&(saved.taskDone[String(selected)]||[]).length>=25?"You finished today’s 25 questions! 🎉":question.hint):'Have another look at the choices. You can try again.'}</p></div>{answer!==question.answer&&<button onClick={()=>setAnswer('')} aria-label="Try again"><RotateCcw size={17}/></button>}</div>}<div className="lesson-bottom"><button className="hint-button" onClick={()=>setShowHint(!showHint)}><CircleHelp size={17}/>{showHint?'Hide hint':'Need a little hint?'}</button><button className="next-button" disabled={answer!==question.answer||(questionIndex===dailyQuestions.length-1&&selected>=allLessons.length)} onClick={nextQuestion}>{questionIndex<dailyQuestions.length-1?'Next question':selected<allLessons.length?'Next activity':'Plan complete'} <ChevronRight size={17}/></button></div>{showHint&&<div className="hint-box">💡 {question.hint}</div>}</article><div className="gentle-note"><span>🌼</span><p><b>It's okay to think slowly.</b> Every try helps your brain grow. No timers, just learning.</p></div></section>
        </section>
      </main><footer className="footer"><span>Made for curious minds</span><span>Grown-up? <button onClick={()=>setTab('parent')}>Open parent area</button></span></footer>
    </>:tab==='game'?<main className="game-page"><section className="game-hero"><span className="eyebrow"><Gamepad2 size={15}/> NUMBER NEST · TWO PLAYER</span><h1>Race to the treasure!</h1><p>Take turns solving a quick maths question. Reach the middle first to win a medal.</p><div className="medal-count"><Trophy size={20}/> {saved.medals} medals earned</div></section><section className="race-board"><div className="race-head"><div><span className="eyebrow">THE TREASURE PATH</span><h2>Two friends, one shiny prize</h2></div><span className="treasure">🏆</span></div><div className="race-lane"><div className="race-player">🧒🏻<b>Player 1</b><small>START</small></div><div className="race-spaces">{[1,2,3,4,5].map(step=><span key={step} className={race.positions[0]>=step?'reached':''}>{race.positions[0]===step?'🧒🏻':step===5?'⭐':'·'}</span>)}</div><span className="center-prize">🎁</span></div><div className="race-lane reverse"><span className="center-prize">🎁</span><div className="race-spaces">{[1,2,3,4,5].map(step=><span key={step} className={race.positions[1]>=step?'reached':''}>{race.positions[1]===step?'🧒🏽':step===5?'⭐':'·'}</span>)}</div><div className="race-player">🧒🏽<b>Player 2</b><small>START</small></div></div><div className="race-progress"><span>🧒🏻 Player 1 <b>{race.positions[0]}/5</b></span><span>🧒🏽 Player 2 <b>{race.positions[1]}/5</b></span></div></section><section className="race-question-card"><div className="race-turn"><span className={`turn-pill player-${race.turn+1}`}>🧒 {race.status==='won'?`Player ${race.turn+1} wins!`:`Player ${race.turn+1}’s turn`}</span><span className={`timer-pill ${race.seconds<=2&&race.status==='playing'?'urgent':''}`}><Timer size={20}/>{race.status==='playing'?race.seconds:5}s</span></div><div className="race-message" role="status">{race.status==='won'?'🎉 '+race.message:race.message}</div>{race.status==='ready'?<div className="race-start"><p>Each player gets <b>5 seconds</b> to choose one of four answers. A wrong answer or timeout sends that player back to start.</p><button className="next-button race-start-button" onClick={()=>setRace({...newRace(),status:'playing',seconds:5})}>Start the race <ChevronRight size={21}/></button></div>:race.status==='playing'?<><div className="race-prompt">{race.question.prompt}</div><div className="race-answers">{race.question.choices.map((choice,index)=><button key={`${choice}-${index}`} onClick={()=>answerRace(choice)}><span>{String.fromCharCode(65+index)}</span>{choice}</button>)}</div></>:<div className="race-win"><span>🏅</span><div><b>Treasure found!</b><p>+1 medal and +10 stars. Play again for another award.</p></div></div>}{race.status!=='ready'&&<button className="race-reset" onClick={resetRace}><RotateCcw size={17}/>{race.status==='won'?'Play again':'Reset game'}</button>}</section><p className="game-footnote">Both players share this device. Questions are simple addition and subtraction.</p></main>:<main className="parent-page"><div className="parent-title"><div className="parent-icon"><Settings2/></div><div><span className="eyebrow">GROWN-UP SPACE</span><h1>Parent area</h1><p>See progress and add new little challenges.</p></div><button className="close-parent" onClick={()=>setTab('learn')}><X/></button></div><section className="cloud-auth-card"><div className="cloud-auth-heading"><div><span className="eyebrow">SUPABASE CLOUD · {cloudConfigured ? 'CONNECTED' : 'SETUP NEEDED'}</span><h2>{session ? 'Parent account connected' : 'Connect a parent account'}</h2><p>{session ? `Signed in as ${session.user.email}. Progress syncs to your account.` : 'Sign in to sync progress and publish your activities across devices.'}</p></div>{session && <button className="outline-button" onClick={signOutParent}>Sign out</button>}</div>{supabase && !session && <form className="auth-form" onSubmit={authenticateParent}><input type="email" required value={cloudEmail} onChange={e=>setCloudEmail(e.target.value)} placeholder="Parent email"/><input type="password" minLength={8} required value={cloudPassword} onChange={e=>setCloudPassword(e.target.value)} placeholder="Password (at least 8 characters)"/><button className="publish-button">{createAccount?'Create parent account':'Sign in'}</button><button type="button" className="text-button" onClick={()=>setCreateAccount(!createAccount)}>{createAccount?'Already have an account? Sign in':'New here? Create a parent account'}</button></form>}{!supabase && <p className="cloud-message">Add the Project URL and publishable key to the app environment to enable sign-in and syncing.</p>}{cloudMessage && <p className="cloud-message" role="status">{cloudMessage}</p>}</section><div className="parent-cards"><section className="parent-card progress-parent"><span className="eyebrow">THIS DEVICE</span><h2>A little progress goes a long way.</h2><div className="parent-stats"><div><b>{saved.done.length}<small>/30</small></b><span>days done</span></div><div><b>{saved.stars} ⭐</b><span>stars earned</span></div><div><b>{saved.custom.length}</b><span>your tasks</span></div></div><div className="progress-track"><i style={{width:`${progress}%`}}/></div><p className="muted">{session ? "Progress syncs to your parent account." : "Progress is saved in this browser/device."}</p></section><section className="parent-card task-editor"><div className="editor-heading"><div><span className="eyebrow">CONTENT STUDIO · LOCAL</span><h2>Add a learning task</h2></div><span className="editor-emoji">✏️</span></div><div className="form-grid"><label>Task title<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="e.g. Count the stars"/></label><label>Topic<select value={draft.topic} onChange={e=>setDraft({...draft,topic:e.target.value})}>{['Number sense','Addition','Subtraction','Patterns','Reasoning','Shapes','Everyday maths','Measurement'].map(x=><option key={x}>{x}</option>)}</select></label><label className="wide">Question<input value={draft.prompt} onChange={e=>setDraft({...draft,prompt:e.target.value})} placeholder="Write a short question"/></label><label className="wide">Answer choices<input value={draft.options} onChange={e=>setDraft({...draft,options:e.target.value})} placeholder="Separate choices with commas"/></label><label>Correct answer<input value={draft.answer} onChange={e=>setDraft({...draft,answer:e.target.value})} placeholder="Must match a choice"/></label><label>Hint or explanation<input value={draft.hint} onChange={e=>setDraft({...draft,hint:e.target.value})} placeholder="A gentle helpful hint"/></label></div><button className="publish-button" onClick={addTask}><Plus size={18}/> Save task on this device</button>{saved.custom.length>0&&<div className="task-publish-list">{saved.custom.map((item,i)=><div key={`${item.title}-${i}`}><span>{item.title}</span><button className="outline-button" disabled={!session||!!item.remoteId} onClick={()=>publishTask(item)}>{item.remoteId?'Published':session?'Publish to cloud':'Sign in to publish'}</button></div>)}</div>}<div className="import-row"><div><b>Move tasks between devices</b><small>Export your tasks as JSON or import a saved file.</small></div><button className="outline-button" onClick={exportJson}><Download size={15}/> Export</button><label className="outline-button upload-button"><Upload size={15}/> Import<input type="file" accept="application/json,.json" onChange={e=>importJson(e.target.files?.[0])}/></label></div>{notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}</section></div><div className="supabase-note"><span>☁️</span><div><b>Cloud sync keeps learning together</b><p>Sign in with a parent account to sync progress and publish your own activities. The 30 starter lessons remain available offline.</p></div><ChevronRight size={18}/></div></main>}
  </div>
}

export default App
