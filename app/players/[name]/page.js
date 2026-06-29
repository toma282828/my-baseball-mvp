import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';
import { aggregateBatting, aggregatePitching, fmtAvg, fmtEra, outsToIp, fmtJersey, buildAllAwards } from '@/lib/stats';
import { formatDate, getTodayYear } from '@/lib/date';

function StatCard({ label, value }) {
  return (
    <div className="card" style={{margin:0,padding:'10px 12px'}}>
      <span className="lbl">{label}</span>
      <span className="val">{value ?? '—'}</span>
    </div>
  );
}

export default async function PlayerPage({ params }) {
  const { name: encodedName } = await params;
  const name = decodeURIComponent(encodedName);

  const teamSlug = await getCurrentTeamSlug();
  const { players, games, stats } = await getAppData(teamSlug);
  const player = players.find((p) => p.name === name);
  if (!player) notFound();

  const currentYear = getTodayYear();
  const allAwards   = buildAllAwards(players, stats, games, currentYear);
  const myAwards    = allAwards[name] || [];

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));
  // 存在する試合のみ対象（削除済み試合の孤立データを除外）
  const playerStats = stats.filter((s) => s.player_name === name && gameMap[s.game_id]);
  const bat = aggregateBatting(playerStats);
  const pit = aggregatePitching(playerStats);
  const hasBat = playerStats.some((r) => r.ab > 0 || (r.bb ?? 0) > 0 || (r.bunt ?? 0) > 0 || (r.sf ?? 0) > 0);
  const hasPit = playerStats.some((r) => r.ip_outs > 0 || r.decision);

  const gameHistory = playerStats
    .map((s) => ({ ...s, game: gameMap[s.game_id] }))
    .sort((a, b) => b.game.date.localeCompare(a.game.date));

  return (
    <div>
      <Link href="/players" className="back-link">← 選手一覧に戻る</Link>

      {/* 選手カード */}
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontSize:'2rem',fontWeight:700}}>
          #{fmtJersey(player.jersey_num, player.jersey_double_zero)}
        </div>
        <div style={{fontSize:'1.1rem',fontWeight:600}}>{player.name}</div>
        <div style={{fontSize:'.8rem',opacity:.6,marginTop:4}}>{player.position}</div>
        {myAwards.length > 0 && (
          <div className="player-titles">
            {myAwards.map((a, i) => (
              <span key={i} className={`king-badge${a.golden?' golden':''}`}>{a.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* 打撃成績 */}
      {hasBat && (
        <>
          <h3>打撃成績（累計）</h3>
          <div className="stat-grid">
            <StatCard label="打率"       value={fmtAvg(bat.avg)} />
            <StatCard label="安打"       value={bat.hit} />
            <StatCard label="打数"       value={bat.ab} />
            <StatCard label="打席数"     value={bat.pa} />
            <StatCard label="本塁打"     value={bat.hr} />
            <StatCard label="打点"       value={bat.rbi} />
            <StatCard label="得点"       value={bat.run_scored} />
            <StatCard label="塁打"       value={bat.tb} />
            <StatCard label="盗塁"       value={bat.sb} />
            <StatCard label="盗塁死"     value={bat.cs} />
            <StatCard label="四死球"     value={bat.bb} />
            <StatCard label="三振"       value={bat.so_bat} />
            <StatCard label="犠打"       value={bat.bunt} />
            <StatCard label="犠飛"       value={bat.sf} />
            <StatCard label="二塁打"     value={bat.s2} />
            <StatCard label="三塁打"     value={bat.s3} />
            <StatCard label="出塁率"     value={fmtAvg(bat.obp)} />
            <StatCard label="長打率"     value={fmtAvg(bat.slg)} />
            <StatCard label="OPS"        value={bat.ops?.toFixed(3) ?? '—'} />
            {bat.risp_ab > 0 && (
              <StatCard label="得点圏打率" value={`${fmtAvg(bat.risp_avg)}（${bat.risp_hit}/${bat.risp_ab}）`} />
            )}
          </div>
        </>
      )}

      {/* 投手成績 */}
      {hasPit && (
        <>
          <h3>投手成績（累計）</h3>
          <div className="stat-grid">
            <StatCard label="防御率"   value={fmtEra(pit.era)} />
            <StatCard label="勝率"     value={pit.win_pct != null ? fmtAvg(pit.win_pct) : '—'} />
            <StatCard label="勝利"     value={pit.win} />
            <StatCard label="敗戦"     value={pit.lose} />
            <StatCard label="セーブ"   value={pit.sv} />
            <StatCard label="ホールド" value={pit.hold} />
            <StatCard label="HP"       value={pit.hp} />
            <StatCard label="奪三振"   value={pit.so} />
            <StatCard label="投球回"   value={outsToIp(pit.ipOuts)} />
            <StatCard label="登板数"   value={pit.appearances} />
            <StatCard label="先発"     value={pit.starts} />
            <StatCard label="リリーフ" value={pit.reliefs} />
            <StatCard label="完投"     value={pit.cg} />
            <StatCard label="完封"     value={pit.sho} />
            <StatCard label="被安打"   value={pit.h_allowed} />
            <StatCard label="被本塁打" value={pit.hr_allowed} />
            <StatCard label="与四死球" value={pit.bb_allowed} />
            <StatCard label="失点"     value={pit.r_allowed} />
            <StatCard label="自責点"   value={pit.er} />
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
            const hasBatRow = (s.ab ?? 0) > 0 || (s.bb ?? 0) > 0 || (s.bunt ?? 0) > 0 || (s.sf ?? 0) > 0;
            const hasPitRow = s.ip_outs > 0 || s.decision;
            return (
              <Link key={s.id} href={`/games/${s.game_id}`} className="game-card">
                <div className="game-card-top">
                  <span>{formatDate(s.game.date)} vs {s.game.opponent}</span>
                  <span>{s.game.our_score} — {s.game.their_score}</span>
                </div>
                {hasBatRow && (
                  <div className="game-card-score" style={{fontSize:'.88rem'}}>
                    打: {s.ab}打数{(s.s1??0)+(s.s2??0)+(s.s3??0)+(s.hr??0)}安打
                    {(s.hr??0)>0?` ${s.hr}HR`:''} {s.rbi??0}打点
                    {(s.bb??0)>0?` ${s.bb}四死球`:''}
                    {(s.bunt??0)>0?` ${s.bunt}犠打`:''}
                    {(s.sf??0)>0?` ${s.sf}犠飛`:''}
                    {(s.sb??0)>0?` ${s.sb}盗塁`:''}
                  </div>
                )}
                {hasPitRow && (
                  <div className="game-card-ground">
                    投: {outsToIp(s.ip_outs)}回 {s.er}自責 {s.so_p}K {s.decision??''}
                    {s.is_start?'（先発）':'（リリーフ）'}
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
