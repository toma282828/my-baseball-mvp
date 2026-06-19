'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/date';

export default function GameSearch({ games, teamName }) {
  const [dateQ, setDateQ] = useState('');
  const [oppQ, setOppQ] = useState('');

  const filtered = games.filter((g) => {
    const dateMatch = !dateQ || g.date === dateQ;
    const oppMatch = !oppQ || g.opponent.toLowerCase().includes(oppQ.toLowerCase());
    return dateMatch && oppMatch;
  });
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2>試合結果検索</h2>
      <label>日付で絞り込む</label>
      <input type="date" value={dateQ} onChange={(e) => setDateQ(e.target.value)} />
      <label>対戦相手で絞り込む</label>
      <input type="text" value={oppQ} onChange={(e) => setOppQ(e.target.value)} placeholder="例: ライオンズ" />
      {(dateQ || oppQ) && (
        <p className="hint" style={{cursor:'pointer'}} onClick={() => { setDateQ(''); setOppQ(''); }}>
          ✕ 絞り込みをクリア
        </p>
      )}

      <div style={{marginTop:16}}>
        {sorted.length === 0 ? (
          <p className="search-empty">試合がありません</p>
        ) : sorted.map((g) => {
          const badgeCls = g.result === 'win' ? 'badge-win' : g.result === 'lose' ? 'badge-lose' : 'badge-draw';
          const label = g.result === 'win' ? '勝ち' : g.result === 'lose' ? '負け' : '引分';
          return (
            <Link key={g.id} href={`/games/${g.id}`} className="game-card">
              <div className="game-card-top">
                <span>{formatDate(g.date)}</span>
                <span className={`badge ${badgeCls}`}>{label}</span>
              </div>
              <div className="game-card-score">
                {teamName} {g.our_score} — {g.their_score} {g.opponent}
              </div>
              {g.ground && <div className="game-card-ground">📍 {g.ground}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
