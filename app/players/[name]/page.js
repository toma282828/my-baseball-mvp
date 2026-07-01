import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';
import { aggregateBatting, aggregatePitching, fmtJersey, buildAllAwards } from '@/lib/stats';
import { getTodayYear } from '@/lib/date';
import { normalizePosition } from '@/lib/positions';
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

  const displayPosition = normalizePosition(player.position);

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
          #{fmtJersey(player.jersey_num, player.jersey_double_zero)}
          {displayPosition ? ` · ${displayPosition}` : ''}
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
        gameHistory={gameHistory}
      />
    </div>
  );
}
