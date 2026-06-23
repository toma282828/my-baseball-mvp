import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAppData } from '@/lib/db';
import { aggregateBatting, aggregatePitching, fmtAvg, fmtEra, outsToIp, fmtJersey, buildAllAwards } from '@/lib/stats';
import { getTodayYear } from '@/lib/date';
import { formatDate } from '@/lib/date';

export default async function PlayerPage({ params }) {
  const { name: encodedName } = await params;
  const name = decodeURIComponent(encodedName);

  const { players, games, stats } = await getAppData();
  const player = players.find((p) => p.name === name);
  if (!player) notFound();

  const currentYear = getTodayYear();
  const allAwards = buildAllAwards(players, stats, games, currentYear);
  const myAwards = allAwards[name] || [];

  const playerStats = stats.filter((s) => s.player_name === name);
  const bat = aggregateBatting(playerStats);
  const pit = aggregatePitching(playerStats);
  const hasBat = playerStats.some((r) => r.ab > 0);
  const hasPit = playerStats.some((r) => r.ip_outs > 0 || r.decision);

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));
  const gameHistory = playerStats
    .map((s) => ({ ...s, game: gameMap[s.game_id] }))
    .filter((s) => s.game)
    .sort((a, b) => b.game.date.localeCompare(a.game.date));

  return (
    <div>
      <Link href="/players" className="back-link">← 選手一覧に戻る</Link>

      {/* 選手カード */}
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontSize:'2rem',fontWeight:700,color:'var(--green-900)'}}>
          #{fmtJersey(player.jersey_num, player.jersey_double_zero)}
        </div>
        <div style={{fontSize:'1.1rem',fontWeight:600}}>{player.name}</div>
        <div style={{fontSize:'.8rem',color:'#888',marginTop:4}}>{player.position}</div>
        {myAwards.length > 0 && (
          <div className="player-titles">
            {myAwards.map((a, i) => (
              <span key={i} className={`king-badge${a.golden ? ' golden' : ''}`}>
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 打撃成績 */}
      {hasBat && (
        <>
          <h3>打撃成績（累計）</h3>
          <div className="stat-grid">
            {[
              { label: '打率',   value: fmtAvg(bat.avg) },
              { label: '安打',   value: bat.hit },
              { label: '打数',   value: bat.ab },
              { label: '本塁打', value: bat.hr },
              { label: '打点',   value: bat.rbi },
              { label: '盗塁',   value: bat.sb },
              { label: '四死球', value: bat.bb },
              { label: '二塁打', value: bat.s2 },
              { label: '三塁打', value: bat.s3 },
              { label: '出塁率', value: fmtAvg(bat.obp) },
              { label: '長打率', value: fmtAvg(bat.slg) },
              { label: 'OPS',    value: bat.ops?.toFixed(3) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{margin:0,padding:'10px 12px'}}>
                <span className="lbl">{label}</span>
                <span className="val">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 投手成績 */}
      {hasPit && (
        <>
          <h3>投手成績（累計）</h3>
          <div className="stat-grid">
            {[
              { label: '防御率', value: fmtEra(pit.era) },
              { label: '勝利',   value: pit.win },
              { label: '敗戦',   value: pit.lose },
              { label: 'セーブ', value: pit.sv },
              { label: '奪三振', value: pit.so },
              { label: '投球回', value: outsToIp(pit.ipOuts) },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{margin:0,padding:'10px 12px'}}>
                <span className="lbl">{label}</span>
                <span className="val">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasBat && !hasPit && (
        <p className="hint" style={{textAlign:'center',padding:'24px 0'}}>成績データがありません</p>
      )}

      {/* 試合履歴 */}
      {gameHistory.length > 0 && (
        <>
          <h3>試合ごとの成績</h3>
          {gameHistory.map((s) => {
            const hasBatRow = s.ab > 0;
            const hasPitRow = s.ip_outs > 0 || s.decision;
            return (
              <Link key={s.id} href={`/games/${s.game_id}`} className="game-card">
                <div className="game-card-top">
                  <span>{formatDate(s.game.date)} vs {s.game.opponent}</span>
                  <span>{s.game.our_score} — {s.game.their_score}</span>
                </div>
                {hasBatRow && (
                  <div className="game-card-score" style={{fontSize:'.88rem'}}>
                    打: {s.ab}打数{s.s1+s.s2+s.s3+s.hr}安打 {s.hr>0?`${s.hr}HR `:''}{s.rbi}打点{s.sb>0?` ${s.sb}盗塁`:''}
                  </div>
                )}
                {hasPitRow && (
                  <div className="game-card-ground">
                    投: {outsToIp(s.ip_outs)}回 {s.er}自責 {s.so_p}K {s.decision ?? ''}
                  </div>
                )}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
