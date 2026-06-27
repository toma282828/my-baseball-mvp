'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/date';
import { outsToIp, fmtJersey } from '@/lib/stats';

// 打席結果チップの定義
const AB_CHIP = [
  { key:'hr',   label:'本塁打', bg:'#ff6a00', color:'#fff' },
  { key:'s3',   label:'三塁打', bg:'#ff3cca', color:'#fff' },
  { key:'s2',   label:'二塁打', bg:'#9b30ff', color:'#fff' },
  { key:'s1',   label:'単打',   bg:'#39ff14', color:'#0e0e14' },
  { key:'bb',   label:'四死球', bg:'#6bbfff', color:'#0e0e14' },
  { key:'bunt', label:'犠打',   bg:'#888',    color:'#fff' },
  { key:'sf',   label:'犠飛',   bg:'#888',    color:'#fff' },
  { key:'k',    label:'三振',   bg:'#ff2244', color:'#fff' },
  { key:'out',  label:'凡退',   bg:'rgba(255,255,255,0.1)', color:'#aaa', border:'1px solid #444' },
];

/** game_stat の合計値から打席チップ配列を生成 */
function buildAtBatChips(s) {
  const chips = [];
  // ヒット系
  for (let i = 0; i < (s.hr   ?? 0); i++) chips.push('hr');
  for (let i = 0; i < (s.s3   ?? 0); i++) chips.push('s3');
  for (let i = 0; i < (s.s2   ?? 0); i++) chips.push('s2');
  for (let i = 0; i < (s.s1   ?? 0); i++) chips.push('s1');
  // 非打数
  for (let i = 0; i < (s.bb   ?? 0); i++) chips.push('bb');
  for (let i = 0; i < (s.bunt ?? 0); i++) chips.push('bunt');
  for (let i = 0; i < (s.sf   ?? 0); i++) chips.push('sf');
  // 三振・凡退
  for (let i = 0; i < (s.so_bat ?? 0); i++) chips.push('k');
  const outs = (s.ab ?? 0) - ((s.s1??0)+(s.s2??0)+(s.s3??0)+(s.hr??0)) - (s.so_bat ?? 0);
  for (let i = 0; i < Math.max(0, outs); i++) chips.push('out');
  return chips;
}

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
  const badgeCls    = game.result === 'win' ? 'badge-win' : game.result === 'lose' ? 'badge-lose' : 'badge-draw';

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
            const p      = playerMap[s.player_name];
            const hasBat = s.ab > 0 || (s.bb ?? 0) > 0 || (s.bunt ?? 0) > 0 || (s.sf ?? 0) > 0;
            const hasPit = s.ip_outs > 0 || s.decision;
            const chips  = buildAtBatChips(s);
            const hasRisp = (s.risp_ab ?? 0) > 0;

            return (
              <div key={s.id} className="game-stat-card">
                {/* 選手名ヘッダー */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <Link href={`/players/${encodeURIComponent(s.player_name)}`}
                    style={{textDecoration:'none',color:'inherit',display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:'.75rem',color:'var(--ink-muted,#aaa)'}}>
                      #{p ? fmtJersey(p.jersey_num, p.jersey_double_zero) : '—'}
                    </span>
                    <span style={{fontWeight:900,fontSize:'.92rem'}}>{s.player_name}</span>
                    {s.game_position && (
                      <span style={{fontSize:'.68rem',padding:'2px 8px',borderRadius:999,
                        border:'1px solid currentColor',color:'var(--ink-muted,#888)',fontWeight:700}}>
                        {s.game_position}
                      </span>
                    )}
                  </Link>
                  {/* 得点・盗塁サマリ */}
                  {((s.run_scored??0) > 0 || (s.sb??0) > 0) && (
                    <span style={{fontSize:'.72rem',color:'var(--ink-muted,#888)',fontWeight:600}}>
                      {(s.run_scored??0) > 0 && `${s.run_scored}得点`}
                      {(s.run_scored??0) > 0 && (s.sb??0) > 0 && ' · '}
                      {(s.sb??0) > 0 && `${s.sb}盗塁`}
                    </span>
                  )}
                </div>

                {/* 打撃：打席チップ */}
                {hasBat && (
                  <div>
                    {/* チップ列 */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6}}>
                      {chips.map((key, idx) => {
                        const def = AB_CHIP.find(c => c.key === key);
                        return (
                          <span key={idx} style={{
                            display:'inline-flex', alignItems:'center', gap:2,
                            padding:'3px 9px', borderRadius:999,
                            background: def?.bg ?? '#333',
                            color: def?.color ?? '#fff',
                            border: def?.border ?? 'none',
                            fontSize:'.7rem', fontWeight:800,
                          }}>
                            {def?.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* 打点 + 得点圏 */}
                    <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:'.75rem',color:'var(--ink-muted,#888)'}}>
                      {(s.rbi ?? 0) > 0 && (
                        <span><span style={{fontWeight:900,color:'var(--ink-white,#eee)'}}>打点 {s.rbi}</span></span>
                      )}
                      {hasRisp && (
                        <span>
                          得点圏:&nbsp;
                          <span style={{fontWeight:900,color: s.risp_hit > 0 ? 'var(--ink-green,#39ff14)' : 'var(--ink-muted,#aaa)'}}>
                            {s.risp_hit}/{s.risp_ab}
                          </span>
                          &nbsp;<span style={{fontSize:'.65rem'}}>（{s.risp_ab}打席中{s.risp_hit}安打）</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 投手成績 */}
                {hasPit && (
                  <div style={{
                    marginTop: hasBat ? 10 : 0,
                    paddingTop: hasBat ? 10 : 0,
                    borderTop: hasBat ? '1px solid var(--ink-border,#e0e0e0)' : 'none',
                    fontSize:'.82rem',
                  }}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                      <span style={{fontWeight:700,color:'var(--ink-muted,#888)',fontSize:'.72rem'}}>
                        {s.is_start ? '先発' : 'リリーフ'}
                      </span>
                      {[
                        outsToIp(s.ip_outs) + '回',
                        `${s.er ?? 0}自責`,
                        `${s.so_p ?? 0}K`,
                        (s.h_allowed ?? 0) > 0  && `${s.h_allowed}被安打`,
                        (s.bb_allowed ?? 0) > 0 && `${s.bb_allowed}与四死球`,
                        (s.hr_allowed ?? 0) > 0 && `${s.hr_allowed}被HR`,
                        (s.r_allowed ?? 0) > 0  && `${s.r_allowed}失点`,
                      ].filter(Boolean).map((txt, i) => (
                        <span key={i} style={{fontWeight:600}}>{txt}</span>
                      ))}
                      {s.decision && (
                        <span style={{
                          padding:'2px 10px', borderRadius:999, fontWeight:900, fontSize:'.72rem',
                          background: s.decision==='勝ち' ? 'rgba(57,255,20,0.15)' :
                                      s.decision==='セーブ' ? 'rgba(107,191,255,0.15)' :
                                      s.decision==='ホールド' ? 'rgba(155,48,255,0.15)' :
                                      'rgba(255,34,68,0.15)',
                          color: s.decision==='勝ち' ? 'var(--ink-green,#39ff14)' :
                                 s.decision==='セーブ' ? '#6bbfff' :
                                 s.decision==='ホールド' ? 'var(--ink-purple,#9b30ff)' :
                                 'var(--ink-pink,#ff3cca)',
                          border: `1px solid currentColor`,
                        }}>
                          {s.decision}
                        </span>
                      )}
                      {s.cg  && <span style={{fontSize:'.7rem',padding:'2px 8px',borderRadius:999,border:'1px solid #888',color:'#aaa'}}>完投</span>}
                      {s.sho && <span style={{fontSize:'.7rem',padding:'2px 8px',borderRadius:999,border:'1px solid #888',color:'#aaa'}}>完封</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <div style={{display:'flex',gap:10,marginTop:16}}>
        <Link href={`/admin/games/${game.id}/edit`} className="btn btn-outline btn-sm"
          style={{flex:1,textAlign:'center'}}>
          記録を変更する
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="btn btn-sm btn-danger" style={{flex:1,opacity:deleting?0.5:1}}>
          {deleting ? '削除中...' : '試合を削除する'}
        </button>
      </div>
      <p className="hint" style={{textAlign:'center',marginTop:6}}>削除すると元に戻せません</p>
    </div>
  );
}
