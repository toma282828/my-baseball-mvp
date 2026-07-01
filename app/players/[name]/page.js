import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';
import { aggregateBatting, aggregatePitching, fmtJersey, buildAllAwards, outsToIp } from '@/lib/stats';
import { formatDate, getTodayYear } from '@/lib/date';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerStatsPanel from '@/components/PlayerStatsPanel';

export default async function PlayerPage({ params }) {
  const { name: encodedName } = await params;
  const name = decodeURIComponent(encodedName);

  const teamSlug = await getCurrentTeamSlug();
  const { players, games, stats } = await getAppData(teamSlug);
  const player = players.find((p) => p.name === name);
  if (!player) notFound();

  const currentYear = getTodayYear();
  const allAwards = buildAllAwards(players, stats, games, currentYear);
  const myAwards = allAwards[name] || [];

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));
  const playerStats = stats.filter((s) => s.player_name === name && gameMap[s.game_id]);

  const totalBat = aggregateBatting(playerStats);
  const totalPit = aggregatePitching(playerStats);
  const hasBat = playerStats.some((r) =>
    (r.ab ?? 0) > 0 || (r.bb ?? 0) > 0 || (r.bunt ?? 0) > 0 || (r.sf ?? 0) > 0
  );
  const hasPit = playerStats.some((r) => (r.ip_outs ?? 0) > 0 || r.decision);

  const byYear = {};
  for (const s of playerStats) {
    const year = gameMap[s.game_id].date.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(s);
  }

  const yearlyStats = Object.entries(byYear)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, rows]) => {
      const bat = aggregateBatting(rows);
      const pit = aggregatePitching(rows);
      return {
        year: parseInt(year, 10),
        bat,
        pit,
        hasBat: rows.some((r) =>
          (r.ab ?? 0) > 0 || (r.bb ?? 0) > 0 || (r.bunt ?? 0) > 0 || (r.sf ?? 0) > 0
        ),
        hasPit: rows.some((r) => (r.ip_outs ?? 0) > 0 || r.decision),
      };
    });

  const gameHistory = playerStats
    .map((s) => ({ ...s, game: gameMap[s.game_id] }))
    .sort((a, b) => b.game.date.localeCompare(a.game.date));

  return (
    <div>
      <Link href="/players" className="back-link">← 選手一覧に戻る</Link>

      <div className="card player-profile-card">
        <PlayerAvatar
          name={player.name}
          avatarUrl={player.avatar_url}
          jerseyNum={player.jersey_num}
          jerseyDoubleZero={player.jersey_double_zero}
          size={96}
        />
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 12 }}>{player.name}</div>
        <div style={{ fontSize: '.85rem', opacity: .7, marginTop: 4 }}>
          #{fmtJersey(player.jersey_num, player.jersey_double_zero)} · {player.position}
        </div>
        {myAwards.length > 0 && (
          <div className="player-titles">
            {myAwards.map((a, i) => (
              <span key={i} className={`king-badge${a.golden ? ' golden' : ''}`}>{a.label}</span>
            ))}
          </div>
        )}
      </div>

      <PlayerStatsPanel
        totalBat={totalBat}
        totalPit={totalPit}
        hasBat={hasBat}
        hasPit={hasPit}
        yearlyStats={yearlyStats}
      />

      {gameHistory.length > 0 && (
        <>
          <h3>試合ごとの成績</h3>
          {gameHistory.map((s) => {
            const hasBatRow = (s.ab ?? 0) > 0 || (s.bb ?? 0) > 0 || (s.bunt ?? 0) > 0 || (s.sf ?? 0) > 0;
            const hasPitRow = (s.ip_outs ?? 0) > 0 || s.decision;
            return (
              <Link key={s.id} href={`/games/${s.game_id}`} className="game-card">
                <div className="game-card-top">
                  <span>{formatDate(s.game.date)} vs {s.game.opponent}</span>
                  <span>{s.game.our_score} — {s.game.their_score}</span>
                </div>
                {hasBatRow && (
                  <div className="game-card-score" style={{ fontSize: '.88rem' }}>
                    打: {s.ab}打数{(s.s1 ?? 0) + (s.s2 ?? 0) + (s.s3 ?? 0) + (s.hr ?? 0)}安打
                    {(s.hr ?? 0) > 0 ? ` ${s.hr}HR` : ''} {s.rbi ?? 0}打点
                    {(s.bb ?? 0) > 0 ? ` ${s.bb}四死球` : ''}
                    {(s.bunt ?? 0) > 0 ? ` ${s.bunt}犠打` : ''}
                    {(s.sf ?? 0) > 0 ? ` ${s.sf}犠飛` : ''}
                    {(s.sb ?? 0) > 0 ? ` ${s.sb}盗塁` : ''}
                  </div>
                )}
                {hasPitRow && (
                  <div className="game-card-ground">
                    投: {outsToIp(s.ip_outs)}回 {s.er}自責 {s.so_p}K {s.decision ?? ''}
                    {s.is_start ? '（先発）' : '（リリーフ）'}
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
