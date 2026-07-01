'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLAYER_POSITIONS } from '@/lib/positions';

export default function PlayerForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [jerseyNum, setJerseyNum] = useState('');
  const [doubleZero, setDoubleZero] = useState(false);
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('選手名を入力してください'); return; }
    if (!doubleZero && jerseyNum === '') { setError('背番号を入力してください'); return; }

    setSaving(true);
    const res = await fetch('/api/players', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: name.trim(),
        jersey_num: doubleZero ? 0 : parseInt(jerseyNum, 10),
        jersey_double_zero: doubleZero,
        position,
      }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    setToast('登録しました');
    setName(''); setJerseyNum(''); setDoubleZero(false); setPosition(''); setError('');
    setTimeout(() => setToast(''), 3000);
    router.refresh();
    setSaving(false);
  }

  return (
    <div>
      <a onClick={() => router.back()} className="back-link" style={{cursor:'pointer'}}>← 記録員エリアに戻る</a>
      <h2>選手登録</h2>

      <form onSubmit={handleSubmit}>
        <label>選手名</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 田中 太郎" />
        <label>背番号</label>
        <div className="row2">
          <input type="number" value={jerseyNum} onChange={(e) => setJerseyNum(e.target.value)}
            disabled={doubleZero} placeholder="例: 7" min={0} max={99} />
          <label style={{display:'flex',alignItems:'center',gap:6,marginTop:0,fontWeight:400}}>
            <input type="checkbox" checked={doubleZero}
              onChange={(e) => { setDoubleZero(e.target.checked); setJerseyNum(''); }}
              style={{width:'auto'}} />
            00（ダブルゼロ）
          </label>
        </div>
        <label>ポジション</label>
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="">選択してください</option>
          {PLAYER_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {error && <p className="hint warn">{error}</p>}
        {toast && <div className="toast show">{toast}</div>}

        <button type="submit" className="btn" disabled={saving} style={{marginTop:12,opacity:saving?0.6:1}}>
          {saving ? '登録中...' : '選手を登録する'}
        </button>
      </form>
    </div>
  );
}
