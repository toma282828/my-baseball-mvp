'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminArea({ players, teamName }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [authError, setAuthError] = useState('');
  const [openPanel, setOpenPanel] = useState(null);
  const [editTarget, setEditTarget] = useState(players[0]?.id ?? '');
  const [editNum, setEditNum] = useState('');
  const [editDoubleZero, setEditDoubleZero] = useState(false);
  const [editNumMsg, setEditNumMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(players[0]?.id ?? '');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [newTeamName, setNewTeamName] = useState(teamName);
  const [teamNameMsg, setTeamNameMsg] = useState('');

  function togglePanel(panel) {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch('/api/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
    const d = await res.json();
    if (d.ok) { setAuthed(true); setAuthError(''); }
    else setAuthError('パスワードが違います');
  }

  async function handleEditNum(e) {
    e.preventDefault();
    if (!editDoubleZero && editNum === '') { setEditNumMsg('背番号を入力してください'); return; }
    const res = await fetch(`/api/players/${editTarget}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ jersey_num: editDoubleZero ? 0 : parseInt(editNum,10), jersey_double_zero: editDoubleZero }),
    });
    const d = await res.json();
    if (d.error) { setEditNumMsg('エラー: ' + d.error); return; }
    setEditNumMsg('更新しました');
    router.refresh();
  }

  async function handleDelete(e) {
    e.preventDefault();
    const target = players.find((p) => p.id === deleteTarget);
    if (!target) return;
    if (!confirm(`「${target.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/players/${deleteTarget}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.error) { setDeleteMsg('エラー: ' + d.error); return; }
    setDeleteMsg('削除しました');
    router.refresh();
  }

  async function handleTeamName(e) {
    e.preventDefault();
    if (!newTeamName.trim()) { setTeamNameMsg('チーム名を入力してください'); return; }
    const res = await fetch('/api/settings', {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ key: 'team_name', value: newTeamName.trim() }),
    });
    const d = await res.json();
    if (d.error) { setTeamNameMsg('エラー: ' + d.error); return; }
    setTeamNameMsg('保存しました');
    router.refresh();
  }

  if (!authed) {
    return (
      <div>
        <h2>記録員エリア</h2>
        <div className="card">
          <p className="sub">記録員専用エリアです。パスワードを入力してください。</p>
          <form onSubmit={handleLogin}>
            <label>パスワード</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="パスワード" />
            {authError && <p className="hint warn">{authError}</p>}
            <button type="submit" className="btn" style={{marginTop:12}}>入る</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>記録員エリア</h2>

      <div className="recorder-links">
        <Link href="/admin/games/new" className="btn">試合を入力する</Link>
        <Link href="/admin/players/new" className="btn btn-outline">新しい選手を登録する</Link>
      </div>

      {/* 背番号変更 */}
      <div className="settings-card" style={{marginTop:20}}>
        <h3 onClick={() => togglePanel('editNum')} style={{cursor:'pointer'}}>
          背番号を変更する {openPanel === 'editNum' ? '▲' : '▼'}
        </h3>
        {openPanel === 'editNum' && players.length > 0 && (
          <form onSubmit={handleEditNum}>
            <label>変更する選手</label>
            <select value={editTarget} onChange={(e) => setEditTarget(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jersey_double_zero ? '00' : p.jersey_num} {p.name}
                </option>
              ))}
            </select>
            <label>新しい背番号</label>
            <div className="row2">
              <input type="number" value={editNum} onChange={(e) => setEditNum(e.target.value)}
                disabled={editDoubleZero} placeholder="例: 7" min={0} max={99} />
              <label style={{display:'flex',alignItems:'center',gap:6,marginTop:0,fontWeight:400}}>
                <input type="checkbox" checked={editDoubleZero}
                  onChange={(e) => { setEditDoubleZero(e.target.checked); setEditNum(''); }}
                  style={{width:'auto'}} />
                00（ダブルゼロ）
              </label>
            </div>
            {editNumMsg && <p className={`hint ${editNumMsg.startsWith('エラー') ? 'warn' : ''}`}>{editNumMsg}</p>}
            <button type="submit" className="btn btn-sm" style={{marginTop:8}}>変更する</button>
          </form>
        )}
      </div>

      {/* 選手削除 */}
      <div className="settings-card danger-zone">
        <h3 onClick={() => togglePanel('delete')} style={{cursor:'pointer'}}>
          選手を削除する {openPanel === 'delete' ? '▲' : '▼'}
        </h3>
        {openPanel === 'delete' && players.length > 0 && (
          <form onSubmit={handleDelete}>
            <label>削除する選手</label>
            <select value={deleteTarget} onChange={(e) => setDeleteTarget(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jersey_double_zero ? '00' : p.jersey_num} {p.name}
                </option>
              ))}
            </select>
            <p className="hint">※ 過去の試合記録には名前が残りますが、ランキング・選手一覧からは消えます</p>
            {deleteMsg && <p className="hint">{deleteMsg}</p>}
            <button type="submit" className="btn btn-sm btn-danger" style={{marginTop:8}}>この選手を削除</button>
          </form>
        )}
      </div>

      {/* チーム名設定 */}
      <div className="settings-card" style={{marginTop:0}}>
        <h3 onClick={() => togglePanel('teamName')} style={{cursor:'pointer'}}>
          チーム名を変更する {openPanel === 'teamName' ? '▲' : '▼'}
        </h3>
        {openPanel === 'teamName' && (
          <form onSubmit={handleTeamName}>
            <label>チーム名</label>
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="チーム名" />
            {teamNameMsg && <p className="hint">{teamNameMsg}</p>}
            <button type="submit" className="btn btn-sm" style={{marginTop:8}}>保存する</button>
          </form>
        )}
      </div>

      {/* 登録選手一覧 */}
      {players.length > 0 && (
        <div className="card" style={{marginTop:8}}>
          <h3>登録選手（{players.length}人）</h3>
          <ul className="player-list" style={{marginTop:8}}>
            {players.map((p) => (
              <li key={p.id} style={{cursor:'default'}}>
                <span className="num">#{p.jersey_double_zero ? '00' : p.jersey_num}</span>
                <span className="name">{p.name}</span>
                <span className="pos">{p.position}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
