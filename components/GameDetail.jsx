'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/date';
import { outsToIp, fmtJersey } from '@/lib/stats';

export default function GameDetail({ game, stats, players, teamName }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const playerMap = Object.fromEntries(players.map((p) => [p.name, p]));

  async function handleDelete() {
    if (!confirm(`「${formatDate(game.date)} vs ${game.opponent}」を削除しますか？`)) return;
    setDeleting(true);
    await fetch(`/api/games/${game.id}`, { method: 'DELETE' });
    router.push('/games');
    router.refresh();
  }

  const resultLabel = game.result === 'win' ? '勝ち' : game.result === 'lose' ? '負け' : '引分';
  const badgeCls = game.result === 'win' ? 'badge-win' : game.result === 'lose' ? 'badge-lose' : 'badge-draw';

  return (
    <div>
      <Link href="/games" className="back-link">← 試合検索に戻る</Link>
      <h2>{formatDate(game.date)} vs {game.opponent}</h2>

      <div className="card">
        <div className="score-lg">
          {teamName} {game.our_score} — {game.their_score} {game.opponent}
        </div>
        {game.ground && <div className="ground">📍 {game.ground}</div>}
        <span className={`badge ${badgeCls}`}>{resultLabel}</span>
      </div>

      {stats.length > 0 && (
        <>
          <h3>この試合の個人成績</h3>
          {stats.map((s) => {
            const p = playerMap[s.player_name];
            const hasBat = s.ab > 0;
            const hasPit = s.ip_outs > 0 || s.decision;
            const hit = s.s1 + s.s2 + s.s3 + s.hr;
            return (
              <Link key={s.id} href={`/players/${encodeURIComponent(s.player_name)}`} className="game-stat-card" style={{display:'block',textDecoration:'none',color:'inherit'}}>
                <h4>
                  <span style={{fontSize:'.75rem',color:'#aaa',marginRight:4}}>
                    #{p ? fmtJersey(p.jersey_num, p.jersey_double_zero) : '—'}
                  </span>
                  {s.player_name}
                </h4>
                {hasBat && (
                  <div className="game-stat-line">
                    打: {s.ab}打数{hit}安打 {s.hr > 0 ? `${s.hr}HR ` : ''}{s.rbi}打点{s.sb > 0 ? ` ${s.sb}盗塁` : ''}
                  </div>
                )}
                {hasPit && (
                  <div className="game-stat-line">
                    投: {outsToIp(s.ip_outs)}回 {s.er}自責 {s.so_p}K {s.decision ?? ''}
                  </div>
                )}
              </Link>
            );
          })}
        </>
      )}

      <div style={{display:'flex',gap:10,marginTop:16}}>
        <Link href={`/admin/games/${game.id}/edit`} className="btn btn-outline btn-sm" style={{flex:1,textAlign:'center'}}>
          記録を変更する
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="btn btn-sm" style={{flex:1,background:'#c62828',opacity:deleting?0.5:1}}>
          {deleting ? '削除中...' : '試合を削除する'}
        </button>
      </div>
      <p className="hint" style={{textAlign:'center'}}>削除すると元に戻せません</p>
    </div>
  );
}
