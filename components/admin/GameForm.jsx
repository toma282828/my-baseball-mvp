'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTodayString } from '@/lib/date';
import { fmtJersey } from '@/lib/stats';

// 打席結果の種類
const AB_RESULTS = [
  { key:'s1',   label:'単打',   isHit:true,  isAB:true  },
  { key:'s2',   label:'二塁打', isHit:true,  isAB:true  },
  { key:'s3',   label:'三塁打', isHit:true,  isAB:true  },
  { key:'hr',   label:'本塁打', isHit:true,  isAB:true  },
  { key:'k',    label:'三振',   isHit:false, isAB:true  },
  { key:'out',  label:'凡退',   isHit:false, isAB:true  },
  { key:'bb',   label:'四死球', isHit:false, isAB:false },
  { key:'bunt', label:'犠打',   isHit:false, isAB:false },
  { key:'sf',   label:'犠飛',   isHit:false, isAB:false },
];

function calcFromAtBats(atBats) {
  const ab      = atBats.filter(a => !['bb','bunt','sf'].includes(a.result)).length;
  const s1      = atBats.filter(a => a.result==='s1').length;
  const s2      = atBats.filter(a => a.result==='s2').length;
  const s3      = atBats.filter(a => a.result==='s3').length;
  const hr      = atBats.filter(a => a.result==='hr').length;
  const bb      = atBats.filter(a => a.result==='bb').length;
  const so_bat  = atBats.filter(a => a.result==='k').length;
  const bunt    = atBats.filter(a => a.result==='bunt').length;
  const sf      = atBats.filter(a => a.result==='sf').length;
  const rbi     = atBats.reduce((s,a)=>s+(parseInt(a.rbi)||0),0);
  const risp_ab = atBats.filter(a=>a.risp&&!['bb','bunt','sf'].includes(a.result)).length;
  const risp_hit= atBats.filter(a=>a.risp&&['s1','s2','s3','hr'].includes(a.result)).length;
  return { ab, s1, s2, s3, hr, bb, so_bat, bunt, sf, rbi, risp_ab, risp_hit };
}

function makeEntry(playerName) {
  return {
    player_name: playerName,
    showBat: true, showPit: false,
    atBats: [],
    run_scored: '', sb: '', cs: '',
    pit: {
      ip:'', so_p:'', er:'', decision:'',
      is_start: false, cg: false, sho: false,
      h_allowed:'', hr_allowed:'', bb_allowed:'', r_allowed:'',
    },
  };
}

function entryFromStat(s) {
  return {
    player_name: s.player_name,
    showBat: s.ab > 0,
    showPit: s.ip_outs > 0 || !!s.decision,
    atBats: [],
    // 旧形式の合計をそのまま保持（編集時に使う）
    manualBat: {
      ab: s.ab??0, s1: s.s1??0, s2: s.s2??0, s3: s.s3??0,
      hr: s.hr??0, rbi: s.rbi??0, sb: s.sb??0, bb: s.bb??0,
      run_scored: s.run_scored??0, so_bat: s.so_bat??0,
      bunt: s.bunt??0, sf: s.sf??0, cs: s.cs??0,
      risp_ab: s.risp_ab??0, risp_hit: s.risp_hit??0,
    },
    run_scored: s.run_scored??'',
    sb: s.sb??'', cs: s.cs??'',
    pit: {
      ip: s.ip_outs ? `${Math.floor(s.ip_outs/3)}.${s.ip_outs%3}` : '',
      so_p: s.so_p??'', er: s.er??'', decision: s.decision??'',
      is_start: s.is_start??false, cg: s.cg??false, sho: s.sho??false,
      h_allowed: s.h_allowed??'', hr_allowed: s.hr_allowed??'',
      bb_allowed: s.bb_allowed??'', r_allowed: s.r_allowed??'',
    },
  };
}

function ipToOuts(ip) {
  if (!ip) return 0;
  const [w, f] = String(ip).split('.');
  return parseInt(w||0)*3 + parseInt(f||0);
}

export default function GameForm({ players, initialGame, initialStats }) {
  const router = useRouter();
  const isEdit = !!initialGame;

  const [date,       setDate]       = useState(initialGame?.date ?? getTodayString());
  const [opponent,   setOpponent]   = useState(initialGame?.opponent ?? '');
  const [ground,     setGround]     = useState(initialGame?.ground ?? '');
  const [ourScore,   setOurScore]   = useState(initialGame?.our_score ?? '');
  const [theirScore, setTheirScore] = useState(initialGame?.their_score ?? '');
  const [result,     setResult]     = useState(initialGame?.result ?? 'win');
  const [entries,    setEntries]    = useState(
    initialStats ? initialStats.map(entryFromStat) : []
  );
  const [addName, setAddName]   = useState('');
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');
  const [toast,   setToast]     = useState('');

  // 打席追加用の一時状態
  const [pendingAB, setPendingAB] = useState({}); // { playerName: {result, risp, rbi} }

  const usedNames  = new Set(entries.map((e) => e.player_name));
  const available  = players.filter((p) => !usedNames.has(p.name));

  function addPlayer() {
    const name = addName || (available[0]?.name ?? '');
    if (!name || usedNames.has(name)) return;
    setEntries((prev) => [...prev, makeEntry(name)]);
    setAddName('');
  }

  function removeEntry(name) {
    setEntries((prev) => prev.filter((e) => e.player_name !== name));
  }

  function updateEntry(name, field, val) {
    setEntries((prev) => prev.map((e) => e.player_name===name ? {...e, [field]:val} : e));
  }

  function updatePit(name, field, val) {
    setEntries((prev) => prev.map((e) =>
      e.player_name===name ? {...e, pit:{...e.pit, [field]:val}} : e));
  }

  function updateManualBat(name, field, val) {
    setEntries((prev) => prev.map((e) =>
      e.player_name===name ? {...e, manualBat:{...e.manualBat, [field]:val}} : e));
  }

  function setPending(name, field, val) {
    setPendingAB((prev) => ({
      ...prev,
      [name]: { result:'out', risp:false, rbi:0, ...(prev[name]||{}), [field]:val },
    }));
  }

  function commitAB(name) {
    const ab = pendingAB[name];
    if (!ab?.result) return;
    setEntries((prev) => prev.map((e) =>
      e.player_name===name ? {...e, atBats:[...e.atBats, { result:ab.result, risp:ab.risp||false, rbi:ab.rbi||0 }]} : e));
    setPendingAB((prev) => ({ ...prev, [name]: { result:'out', risp:false, rbi:0 } }));
  }

  function removeAB(name, idx) {
    setEntries((prev) => prev.map((e) =>
      e.player_name===name ? {...e, atBats:e.atBats.filter((_,i)=>i!==idx)} : e));
  }

  function buildPayload() {
    return entries.map((entry) => {
      let batFields;
      if (isEdit) {
        // 編集時は manualBat の合計値を使う
        const m = entry.manualBat || {};
        batFields = {
          ab: parseInt(m.ab)||0, s1: parseInt(m.s1)||0, s2: parseInt(m.s2)||0,
          s3: parseInt(m.s3)||0, hr: parseInt(m.hr)||0, rbi: parseInt(m.rbi)||0,
          bb: parseInt(m.bb)||0, run_scored: parseInt(m.run_scored)||0,
          so_bat: parseInt(m.so_bat)||0, bunt: parseInt(m.bunt)||0,
          sf: parseInt(m.sf)||0, cs: parseInt(m.cs)||0,
          risp_ab: parseInt(m.risp_ab)||0, risp_hit: parseInt(m.risp_hit)||0,
        };
      } else {
        // 新規: atBats から計算
        const calc = calcFromAtBats(entry.atBats);
        batFields = {
          ...calc,
          run_scored: parseInt(entry.run_scored)||0,
          cs: parseInt(entry.cs)||0,
        };
      }
      return {
        player_name: entry.player_name,
        ...batFields,
        sb: parseInt(entry.sb)||0,
        ip_outs:    entry.showPit ? ipToOuts(entry.pit.ip) : 0,
        so_p:       entry.showPit ? parseInt(entry.pit.so_p)||0 : 0,
        er:         entry.showPit ? parseInt(entry.pit.er)||0  : 0,
        decision:   entry.showPit ? (entry.pit.decision||null) : null,
        is_start:   entry.showPit ? !!entry.pit.is_start  : false,
        cg:         entry.showPit ? !!entry.pit.cg        : false,
        sho:        entry.showPit ? !!entry.pit.sho       : false,
        h_allowed:  entry.showPit ? parseInt(entry.pit.h_allowed)||0  : 0,
        hr_allowed: entry.showPit ? parseInt(entry.pit.hr_allowed)||0 : 0,
        bb_allowed: entry.showPit ? parseInt(entry.pit.bb_allowed)||0 : 0,
        r_allowed:  entry.showPit ? parseInt(entry.pit.r_allowed)||0  : 0,
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date||!opponent.trim()||!ground.trim()||ourScore===''||theirScore==='') {
      setError('試合日・対戦相手・グラウンド・スコアを入力してください'); return;
    }
    const statsPayload = buildPayload();
    setSaving(true); setError('');
    const game = { date, opponent:opponent.trim(), ground:ground.trim(),
      our_score:parseInt(ourScore), their_score:parseInt(theirScore), result };
    const res = isEdit
      ? await fetch(`/api/games/${initialGame.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({game,stats:statsPayload}) })
      : await fetch('/api/games', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({game,stats:statsPayload}) });
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    if (isEdit) {
      router.push(`/games/${initialGame.id}`);
    } else {
      setToast('保存しました');
      setDate(getTodayString()); setOpponent(''); setGround('');
      setOurScore(''); setTheirScore(''); setResult('win'); setEntries([]);
      setTimeout(() => setToast(''), 3000);
    }
    router.refresh(); setSaving(false);
  }

  return (
    <div>
      <a onClick={() => router.back()} className="back-link" style={{cursor:'pointer'}}>← 記録員エリアに戻る</a>
      <h2>{isEdit ? '試合記録の変更' : '試合記録入力'}</h2>

      <form onSubmit={handleSubmit}>
        <label>試合日</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        <label>対戦相手</label>
        <input type="text" value={opponent} onChange={(e)=>setOpponent(e.target.value)} placeholder="例: ライオンズ" />
        <label>グラウンド名</label>
        <input type="text" value={ground} onChange={(e)=>setGround(e.target.value)} placeholder="例: 市民グラウンド" />
        <label>自チーム / 相手チーム スコア</label>
        <div className="row2">
          <input type="number" value={ourScore} onChange={(e)=>setOurScore(e.target.value)} placeholder="自チーム" min={0} />
          <input type="number" value={theirScore} onChange={(e)=>setTheirScore(e.target.value)} placeholder="相手" min={0} />
        </div>
        <label>勝敗</label>
        <select value={result} onChange={(e)=>setResult(e.target.value)}>
          <option value="win">勝ち</option>
          <option value="lose">負け</option>
          <option value="draw">引き分け</option>
        </select>

        <h3>出場選手の成績</h3>

        {entries.map((entry) => {
          const pend = pendingAB[entry.player_name] || { result:'out', risp:false, rbi:0 };
          const calcTotals = isEdit ? null : calcFromAtBats(entry.atBats);

          return (
            <div key={entry.player_name} className="player-entry">
              <div className="player-entry-header">
                <h4>{entry.player_name}</h4>
                <button type="button" className="remove-player-btn" onClick={()=>removeEntry(entry.player_name)}>削除</button>
              </div>

              <div className="tabs" style={{marginBottom:8}}>
                <button type="button" onClick={()=>updateEntry(entry.player_name,'showBat',!entry.showBat)}
                  className={entry.showBat?'active':''} style={{fontSize:'.72rem'}}>打撃</button>
                <button type="button" onClick={()=>updateEntry(entry.player_name,'showPit',!entry.showPit)}
                  className={entry.showPit?'active':''} style={{fontSize:'.72rem'}}>投手</button>
              </div>

              {/* ── 打撃 ── */}
              {entry.showBat && (
                <div>
                  {isEdit ? (
                    /* 編集時: 合計値を直接入力 */
                    <>
                      <div className="stat-type-label">打撃成績（合計）</div>
                      <div className="field-grid">
                        {[['ab','打数'],['s1','単打'],['s2','二塁打'],['s3','三塁打'],
                          ['hr','本塁打'],['rbi','打点'],['bb','四死球'],['sb','盗塁'],
                          ['run_scored','得点'],['so_bat','三振'],['bunt','犠打'],['sf','犠飛'],
                          ['cs','盗塁死'],['risp_ab','得点圏打数'],['risp_hit','得点圏安打']].map(([f,lbl])=>(
                          <div key={f}>
                            <label>{lbl}</label>
                            <input type="number" min={0}
                              value={entry.manualBat?.[f]??''}
                              onChange={(ev)=>updateManualBat(entry.player_name,f,ev.target.value)} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* 新規: 1打席ごと入力 */
                    <>
                      <div className="stat-type-label">打撃成績（1打席ごと）</div>

                      {/* 記録済み打席一覧 */}
                      {entry.atBats.length > 0 && (
                        <div style={{marginBottom:8}}>
                          {entry.atBats.map((ab, idx) => (
                            <span key={idx} style={{
                              display:'inline-flex', alignItems:'center', gap:3,
                              background: ab.result==='k'?'#ffebee':ab.result==='bb'?'#e3f2fd':
                                          ['s1','s2','s3','hr'].includes(ab.result)?'#e8f5e9':'#f5f5f5',
                              border:'1px solid #ddd', borderRadius:8,
                              padding:'3px 8px', margin:'3px', fontSize:'.72rem', fontWeight:600,
                            }}>
                              {AB_RESULTS.find(r=>r.key===ab.result)?.label}
                              {ab.risp && <span style={{color:'#e65100',fontSize:'.6rem'}}>圏</span>}
                              {ab.rbi > 0 && <span style={{color:'#1b5e20',fontSize:'.6rem'}}>{ab.rbi}点</span>}
                              <button type="button" onClick={()=>removeAB(entry.player_name,idx)}
                                style={{background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:'.7rem',padding:0}}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 打席追加UI */}
                      <div style={{background:'#f9f9f9',border:'1px solid #e8e8e8',borderRadius:10,padding:10,marginBottom:8}}>
                        <div className="stat-type-label" style={{margin:'0 0 6px'}}>打席を追加</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                          {AB_RESULTS.map((r)=>(
                            <button key={r.key} type="button"
                              onClick={()=>setPending(entry.player_name,'result',r.key)}
                              style={{
                                fontSize:'.72rem', padding:'5px 10px', borderRadius:8,
                                border: pend.result===r.key?'2px solid var(--green-700)':'1px solid #ccc',
                                background: pend.result===r.key?'var(--green-100)':'#fff',
                                fontWeight: pend.result===r.key?700:400,
                              }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                          <label style={{display:'flex',alignItems:'center',gap:4,margin:0,fontWeight:400,fontSize:'.78rem'}}>
                            <input type="checkbox" checked={pend.risp||false}
                              onChange={(e)=>setPending(entry.player_name,'risp',e.target.checked)}
                              style={{width:'auto'}} />
                            得点圏（RISP）
                          </label>
                          <label style={{display:'flex',alignItems:'center',gap:4,margin:0,fontWeight:400,fontSize:'.78rem'}}>
                            打点:
                            <input type="number" min={0} max={9} value={pend.rbi||0}
                              onChange={(e)=>setPending(entry.player_name,'rbi',parseInt(e.target.value)||0)}
                              style={{width:44,padding:'4px 6px',fontSize:'.82rem'}} />
                          </label>
                          <button type="button" className="btn btn-sm btn-outline"
                            onClick={()=>commitAB(entry.player_name)}>追加</button>
                        </div>
                      </div>

                      {/* 別途入力: 得点・盗塁・盗塁死 */}
                      <div className="row2" style={{gap:6}}>
                        {[['run_scored','得点'],['sb','盗塁'],['cs','盗塁死']].map(([f,lbl])=>(
                          <div key={f}>
                            <label style={{fontSize:'.72rem'}}>{lbl}</label>
                            <input type="number" min={0} value={entry[f]||''}
                              onChange={(e)=>updateEntry(entry.player_name,f,e.target.value)} />
                          </div>
                        ))}
                      </div>

                      {/* 打席サマリー */}
                      {entry.atBats.length > 0 && calcTotals && (
                        <p className="hint" style={{marginTop:4}}>
                          {calcTotals.ab}打数{calcTotals.s1+calcTotals.s2+calcTotals.s3+calcTotals.hr}安打
                          {calcTotals.hr>0?` ${calcTotals.hr}本塁打`:''}
                          　{calcTotals.rbi}打点　{calcTotals.bb}四死球
                          {calcTotals.so_bat>0?` ${calcTotals.so_bat}三振`:''}
                          {calcTotals.risp_ab>0?` 得点圏${calcTotals.risp_hit}/${calcTotals.risp_ab}`:''}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── 投手 ── */}
              {entry.showPit && (
                <div style={{marginTop:8}}>
                  <div className="stat-type-label">投手成績</div>
                  <div className="tabs" style={{marginBottom:8}}>
                    <button type="button"
                      onClick={()=>updatePit(entry.player_name,'is_start',true)}
                      className={entry.pit.is_start?'active':''} style={{fontSize:'.72rem'}}>先発</button>
                    <button type="button"
                      onClick={()=>updatePit(entry.player_name,'is_start',false)}
                      className={!entry.pit.is_start?'active':''} style={{fontSize:'.72rem'}}>リリーフ</button>
                  </div>
                  <div className="field-grid">
                    {[['ip','投球回'],['so_p','奪三振'],['er','自責点'],
                      ['h_allowed','被安打'],['hr_allowed','被本塁打'],
                      ['bb_allowed','与四死球'],['r_allowed','失点']].map(([f,lbl])=>(
                      <div key={f}>
                        <label>{lbl}</label>
                        <input type={f==='ip'?'text':'number'} min={0}
                          value={entry.pit[f]||''}
                          placeholder={f==='ip'?'例: 5.1':''}
                          onChange={(e)=>updatePit(entry.player_name,f,e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <label>勝敗・セーブ・ホールド</label>
                  <select value={entry.pit.decision||''}
                    onChange={(e)=>updatePit(entry.player_name,'decision',e.target.value)}>
                    <option value="">—</option>
                    <option value="勝ち">勝ち</option>
                    <option value="負け">負け</option>
                    <option value="セーブ">セーブ</option>
                    <option value="ホールド">ホールド</option>
                  </select>
                  {entry.pit.is_start && (
                    <div style={{display:'flex',gap:12,marginTop:8}}>
                      {[['cg','完投'],['sho','完封']].map(([f,lbl])=>(
                        <label key={f} style={{display:'flex',alignItems:'center',gap:4,fontWeight:400,fontSize:'.82rem',marginTop:0}}>
                          <input type="checkbox" checked={!!entry.pit[f]}
                            onChange={(e)=>updatePit(entry.player_name,f,e.target.checked)}
                            style={{width:'auto'}} />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {available.length > 0 && (
          <div className="add-player-bar">
            <label style={{marginTop:0}}>選手を追加</label>
            <div className="add-player-row">
              <select value={addName} onChange={(e)=>setAddName(e.target.value)}>
                <option value="">選手を選択</option>
                {available.map((p)=>(
                  <option key={p.name} value={p.name}>
                    #{fmtJersey(p.jersey_num,p.jersey_double_zero)} {p.name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-sm btn-outline" onClick={addPlayer}>追加</button>
            </div>
            <p className="hint">※ 選手を選んで追加してください</p>
          </div>
        )}

        {error && <p className="hint warn">{error}</p>}
        {toast && <div className="toast show">{toast}</div>}

        <button type="submit" className="btn" disabled={saving} style={{marginTop:8,opacity:saving?0.6:1}}>
          {saving ? '保存中...' : isEdit ? '変更を保存する' : '保存する'}
        </button>
      </form>
    </div>
  );
}
