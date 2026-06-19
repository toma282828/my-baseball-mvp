'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTodayString } from '@/lib/date';
import { fmtJersey } from '@/lib/stats';

const EMPTY_BAT = { ab: '', s1: '', s2: '', s3: '', hr: '', rbi: '', sb: '', bb: '' };
const EMPTY_PIT = { ip: '', so_p: '', er: '', decision: '' };

function makeStat(playerName) {
  return { player_name: playerName, showBat: true, showPit: false, bat: {...EMPTY_BAT}, pit: {...EMPTY_PIT} };
}

export default function GameForm({ players, initialGame, initialStats }) {
  const router = useRouter();
  const isEdit = !!initialGame;

  const [date, setDate] = useState(initialGame?.date ?? getTodayString());
  const [opponent, setOpponent] = useState(initialGame?.opponent ?? '');
  const [ground, setGround] = useState(initialGame?.ground ?? '');
  const [ourScore, setOurScore] = useState(initialGame?.our_score ?? '');
  const [theirScore, setTheirScore] = useState(initialGame?.their_score ?? '');
  const [result, setResult] = useState(initialGame?.result ?? 'win');
  const [entries, setEntries] = useState(initialStats ?? []);
  const [addName, setAddName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const usedNames = new Set(entries.map((e) => e.player_name));
  const available = players.filter((p) => !usedNames.has(p.name));

  function addPlayer() {
    const name = addName || (available[0]?.name ?? '');
    if (!name || usedNames.has(name)) return;
    setEntries((prev) => [...prev, makeStat(name)]);
    setAddName('');
  }

  function removeEntry(name) {
    setEntries((prev) => prev.filter((e) => e.player_name !== name));
  }

  function updateBat(name, field, val) {
    setEntries((prev) => prev.map((e) => e.player_name === name ? { ...e, bat: { ...e.bat, [field]: val } } : e));
  }

  function updatePit(name, field, val) {
    setEntries((prev) => prev.map((e) => e.player_name === name ? { ...e, pit: { ...e.pit, [field]: val } } : e));
  }

  function toggleSection(name, section) {
    setEntries((prev) => prev.map((e) => e.player_name === name ? { ...e, [section]: !e[section] } : e));
  }

  function ipToOuts(ip) {
    if (!ip) return 0;
    const [whole, frac] = String(ip).split('.');
    return parseInt(whole || 0) * 3 + parseInt(frac || 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date || !opponent.trim() || !ground.trim() || ourScore === '' || theirScore === '') {
      setError('試合日・対戦相手・グラウンド・スコアを入力してください'); return;
    }
    const statsPayload = entries.map((entry) => ({
      player_name: entry.player_name,
      ab: entry.showBat ? parseInt(entry.bat.ab)||0 : 0,
      s1: entry.showBat ? parseInt(entry.bat.s1)||0 : 0,
      s2: entry.showBat ? parseInt(entry.bat.s2)||0 : 0,
      s3: entry.showBat ? parseInt(entry.bat.s3)||0 : 0,
      hr: entry.showBat ? parseInt(entry.bat.hr)||0 : 0,
      rbi: entry.showBat ? parseInt(entry.bat.rbi)||0 : 0,
      sb: entry.showBat ? parseInt(entry.bat.sb)||0 : 0,
      bb: entry.showBat ? parseInt(entry.bat.bb)||0 : 0,
      ip_outs: entry.showPit ? ipToOuts(entry.pit.ip) : 0,
      so_p: entry.showPit ? parseInt(entry.pit.so_p)||0 : 0,
      er: entry.showPit ? parseInt(entry.pit.er)||0 : 0,
      decision: entry.showPit ? (entry.pit.decision || null) : null,
    }));

    setSaving(true); setError('');
    const game = { date, opponent: opponent.trim(), ground: ground.trim(),
      our_score: parseInt(ourScore), their_score: parseInt(theirScore), result };

    const res = isEdit
      ? await fetch(`/api/games/${initialGame.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ game, stats: statsPayload }) })
      : await fetch('/api/games', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ game, stats: statsPayload }) });

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
    router.refresh();
    setSaving(false);
  }

  return (
    <div>
      <a onClick={() => router.back()} className="back-link" style={{cursor:'pointer'}}>← 記録員エリアに戻る</a>
      <h2>{isEdit ? '試合記録の変更' : '試合記録入力'}</h2>
      {isEdit && <p className="hint" style={{marginBottom:12}}>※ 入力ミスがあった場合はこちらから修正できます</p>}

      <form onSubmit={handleSubmit}>
        <label>試合日</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label>対戦相手</label>
        <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="例: ライオンズ" />
        <label>グラウンド名</label>
        <input type="text" value={ground} onChange={(e) => setGround(e.target.value)} placeholder="例: 市民グラウンド" />
        <label>自チーム / 相手チーム スコア</label>
        <div className="row2">
          <input type="number" value={ourScore} onChange={(e) => setOurScore(e.target.value)} placeholder="自チーム" min={0} />
          <input type="number" value={theirScore} onChange={(e) => setTheirScore(e.target.value)} placeholder="相手" min={0} />
        </div>
        <label>勝敗</label>
        <select value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="win">勝ち</option>
          <option value="lose">負け</option>
          <option value="draw">引き分け</option>
        </select>

        <h3>出場選手の成績</h3>

        {entries.map((entry) => (
          <div key={entry.player_name} className="player-entry">
            <div className="player-entry-header">
              <h4>{entry.player_name}</h4>
              <button type="button" className="remove-player-btn" onClick={() => removeEntry(entry.player_name)}>削除</button>
            </div>

            <div className="tabs" style={{marginBottom:8}}>
              <button type="button" onClick={() => toggleSection(entry.player_name, 'showBat')}
                className={entry.showBat ? 'active' : ''} style={{fontSize:'.72rem'}}>打撃</button>
              <button type="button" onClick={() => toggleSection(entry.player_name, 'showPit')}
                className={entry.showPit ? 'active' : ''} style={{fontSize:'.72rem'}}>投手</button>
            </div>

            {entry.showBat && (
              <div>
                <div className="stat-type-label">打撃成績</div>
                <div className="field-grid">
                  {[['ab','打数'],['s1','単打'],['s2','二塁打'],['s3','三塁打'],
                    ['hr','本塁打'],['rbi','打点'],['sb','盗塁'],['bb','四死球']].map(([f,lbl]) => (
                    <div key={f}>
                      <label>{lbl}</label>
                      <input type="number" min={0} value={entry.bat[f]}
                        onChange={(ev) => updateBat(entry.player_name, f, ev.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.showPit && (
              <div>
                <div className="stat-type-label">投手成績</div>
                <div className="row2" style={{gap:6}}>
                  <div>
                    <label>投球回</label>
                    <input type="text" value={entry.pit.ip} placeholder="例: 5.1"
                      onChange={(ev) => updatePit(entry.player_name, 'ip', ev.target.value)} />
                  </div>
                  <div>
                    <label>奪三振</label>
                    <input type="number" min={0} value={entry.pit.so_p}
                      onChange={(ev) => updatePit(entry.player_name, 'so_p', ev.target.value)} />
                  </div>
                  <div>
                    <label>自責点</label>
                    <input type="number" min={0} value={entry.pit.er}
                      onChange={(ev) => updatePit(entry.player_name, 'er', ev.target.value)} />
                  </div>
                  <div>
                    <label>勝敗</label>
                    <select value={entry.pit.decision}
                      onChange={(ev) => updatePit(entry.player_name, 'decision', ev.target.value)}>
                      <option value="">—</option>
                      <option value="勝ち">勝ち</option>
                      <option value="負け">負け</option>
                      <option value="セーブ">セーブ</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {available.length > 0 && (
          <div className="add-player-bar">
            <label style={{marginTop:0}}>選手を追加</label>
            <div className="add-player-row">
              <select value={addName} onChange={(e) => setAddName(e.target.value)}>
                <option value="">選手を選択</option>
                {available.map((p) => (
                  <option key={p.name} value={p.name}>
                    #{fmtJersey(p.jersey_num, p.jersey_double_zero)} {p.name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-sm btn-outline" onClick={addPlayer}>追加</button>
            </div>
            <p className="hint">※ 選手一覧から選んで出場選手の成績入力欄を追加できます</p>
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
