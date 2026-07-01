'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlayerAvatar from '@/components/PlayerAvatar';
import { resizeImageForAvatar } from '@/lib/resizeImage';
import { PLAYER_POSITIONS, normalizePosition } from '@/lib/positions';

function jerseyTaken(players, jerseyNum, doubleZero, excludeId) {
  return players.some((p) => {
    if (p.id === excludeId) return false;
    if (doubleZero) return p.jersey_double_zero;
    const num = parseInt(jerseyNum, 10);
    return !p.jersey_double_zero && p.jersey_num === num;
  });
}

export default function AdminArea({ players, teamName }) {
  const router = useRouter();
  const [openPanel, setOpenPanel] = useState(null);
  const [editTarget, setEditTarget] = useState(players[0]?.id ?? '');
  const [editName, setEditName] = useState('');
  const [editNum, setEditNum] = useState('');
  const [editDoubleZero, setEditDoubleZero] = useState(false);
  const [editPosition, setEditPosition] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(players[0]?.id ?? '');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [newTeamName, setNewTeamName] = useState(teamName);
  const [teamNameMsg, setTeamNameMsg] = useState('');

  const editPlayer = players.find((p) => p.id === editTarget);

  useEffect(() => {
    if (!editPlayer) return;
    setEditName(editPlayer.name);
    setEditNum(editPlayer.jersey_double_zero ? '' : String(editPlayer.jersey_num));
    setEditDoubleZero(!!editPlayer.jersey_double_zero);
    setEditPosition(normalizePosition(editPlayer.position));
    setEditMsg('');
  }, [editTarget, editPlayer?.name, editPlayer?.jersey_num, editPlayer?.jersey_double_zero, editPlayer?.position]);

  function togglePanel(panel) {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }

  async function handleEditPlayer(e) {
    e.preventDefault();
    if (!editTarget || !editPlayer) return;
    if (!editName.trim()) { setEditMsg('名前を入力してください'); return; }
    if (!editDoubleZero && editNum === '') { setEditMsg('背番号を入力してください'); return; }

    const jerseyNum = editDoubleZero ? 0 : parseInt(editNum, 10);
    if (jerseyTaken(players, jerseyNum, editDoubleZero, editTarget)) {
      setEditMsg('この背番号はすでに使われています');
      return;
    }

    setEditSaving(true);
    setEditMsg('');

    try {
      const res = await fetch(`/api/players/${editTarget}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          jersey_num: jerseyNum,
          jersey_double_zero: editDoubleZero,
          position: editPosition,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setEditMsg(d.error ?? '更新に失敗しました');
        setEditSaving(false);
        return;
      }

      const fileInput = e.target.querySelector('input[type="file"]');
      const file = fileInput?.files?.[0];
      if (file) {
        const resized = await resizeImageForAvatar(file);
        const fd = new FormData();
        fd.append('file', resized);
        const avatarRes = await fetch(`/api/players/${editTarget}/avatar`, { method: 'POST', body: fd });
        const avatarData = await avatarRes.json();
        if (!avatarRes.ok) {
          setEditMsg('名前・背番号は保存しましたが、アイコン: ' + (avatarData.error ?? '保存失敗'));
          setEditSaving(false);
          router.refresh();
          return;
        }
        if (fileInput) fileInput.value = '';
      }

      setEditMsg('保存しました');
      router.refresh();
    } catch {
      setEditMsg('通信エラーが発生しました');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAvatarRemove() {
    if (!editTarget) return;
    if (!confirm('アイコンを削除しますか？')) return;
    setEditSaving(true);
    setEditMsg('');
    const res = await fetch(`/api/players/${editTarget}/avatar`, { method: 'DELETE' });
    const d = await res.json();
    setEditSaving(false);
    if (d.error) { setEditMsg('エラー: ' + d.error); return; }
    setEditMsg('アイコンを削除しました');
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
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'team_name', value: newTeamName.trim() }),
    });
    const d = await res.json();
    if (d.error) { setTeamNameMsg('エラー: ' + d.error); return; }
    setTeamNameMsg('保存しました');
    router.refresh();
  }

  return (
    <div>
      <h2>記録員エリア</h2>

      <div className="recorder-links">
        <Link href="/admin/games/new" className="btn">試合を入力する</Link>
        <Link href="/admin/players/new" className="btn btn-outline">新しい選手を登録する</Link>
      </div>

      {/* 選手情報変更 */}
      <div className="settings-card" style={{ marginTop: 20 }}>
        <h3 onClick={() => togglePanel('editPlayer')} style={{ cursor: 'pointer' }}>
          選手情報を変更する {openPanel === 'editPlayer' ? '▲' : '▼'}
        </h3>
        {openPanel === 'editPlayer' && players.length > 0 && (
          <form onSubmit={handleEditPlayer}>
            <label>変更する選手</label>
            <select value={editTarget} onChange={(e) => setEditTarget(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jersey_double_zero ? '00' : p.jersey_num} {p.name}
                </option>
              ))}
            </select>

            {editPlayer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
                <PlayerAvatar
                  name={editPlayer.name}
                  avatarUrl={editPlayer.avatar_url}
                  jerseyNum={editPlayer.jersey_num}
                  jerseyDoubleZero={editPlayer.jersey_double_zero}
                  size={64}
                />
                <span className="hint" style={{ margin: 0 }}>アイコンは下の写真から変更できます</span>
              </div>
            )}

            <label>選手名</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="例: 田中 太郎"
            />

            <label>ポジション</label>
            <select value={editPosition} onChange={(e) => setEditPosition(e.target.value)}>
              <option value="">選択してください</option>
              {PLAYER_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label>背番号</label>
            <div className="row2">
              <input
                type="number"
                value={editNum}
                onChange={(e) => setEditNum(e.target.value)}
                disabled={editDoubleZero}
                placeholder="例: 7"
                min={0}
                max={99}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={editDoubleZero}
                  onChange={(e) => { setEditDoubleZero(e.target.checked); setEditNum(''); }}
                  style={{ width: 'auto' }}
                />
                00（ダブルゼロ）
              </label>
            </div>

            <label>アイコン写真（任意・スマホの写真もOK）</label>
            <input type="file" accept="image/*" />

            {editMsg && (
              <p className={`hint ${editMsg.includes('エラー') || editMsg.includes('使われ') ? 'warn' : ''}`}>
                {editMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-sm" disabled={editSaving}>
                {editSaving ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleAvatarRemove}
                disabled={editSaving || !editPlayer?.avatar_url}
              >
                アイコンを削除
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 選手削除 */}
      <div className="settings-card danger-zone">
        <h3 onClick={() => togglePanel('delete')} style={{ cursor: 'pointer' }}>
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
            <button type="submit" className="btn btn-sm btn-danger" style={{ marginTop: 8 }}>この選手を削除</button>
          </form>
        )}
      </div>

      {/* チーム名設定 */}
      <div className="settings-card" style={{ marginTop: 0 }}>
        <h3 onClick={() => togglePanel('teamName')} style={{ cursor: 'pointer' }}>
          チーム名を変更する {openPanel === 'teamName' ? '▲' : '▼'}
        </h3>
        {openPanel === 'teamName' && (
          <form onSubmit={handleTeamName}>
            <label>チーム名</label>
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="チーム名" />
            {teamNameMsg && <p className="hint">{teamNameMsg}</p>}
            <button type="submit" className="btn btn-sm" style={{ marginTop: 8 }}>保存する</button>
          </form>
        )}
      </div>

      {players.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <h3>登録選手（{players.length}人）</h3>
          <ul className="player-list" style={{ marginTop: 8 }}>
            {players.map((p) => (
              <li key={p.id} style={{ cursor: 'default' }}>
                <span className="num">#{p.jersey_double_zero ? '00' : p.jersey_num}</span>
                <span className="name">{p.name}</span>
                <span className="pos">{normalizePosition(p.position) || '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
