'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildRankings, buildTeamRecord, fmtJersey, QUALIFIED_PA_PER_GAME, QUALIFIED_IP_PER_GAME, outsToIp } from '@/lib/stats';
import PlayerAvatar from '@/components/PlayerAvatar';

const DISPLAY_N = 5;

function RankingRows({ rows, showUnqualifiedLabel }) {
  const elements = [];

  rows.forEach((row, i) => {
    if (showUnqualifiedLabel && i > 0 && row.qualified === false && rows[i - 1].qualified !== false) {
      elements.push(
        <tr key={`unqual-divider-${i}`} className="rank-divider-row">
          <td colSpan={3}>規定未到達</td>
        </tr>
      );
    }
    if (showUnqualifiedLabel && i === 0 && row.qualified === false) {
      elements.push(
        <tr key={`unqual-divider-${i}`} className="rank-divider-row">
          <td colSpan={3}>規定未到達</td>
        </tr>
      );
    }

    elements.push(
      <tr key={`${row.name}-${row.qualified ? 'q' : 'u'}`} className={row.qualified === false ? 'rank-unqualified' : ''}>
        <td className={row.rank === 1 ? 'rank-1' : ''}>{row.rank ?? '—'}</td>
        <td>
          <Link
            href={`/players/${encodeURIComponent(row.name)}`}
            className="player-name-with-avatar"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <PlayerAvatar
              name={row.name}
              avatarUrl={row.avatar_url}
              jerseyNum={row.jersey_num}
              jerseyDoubleZero={row.jersey_double_zero}
              size={28}
            />
            <span className="player-name-inline">
              <span style={{ color: '#aaa', fontSize: '.75rem', marginRight: 4 }}>
                #{fmtJersey(row.jersey_num, row.jersey_double_zero)}
              </span>
              {row.name}
            </span>
          </Link>
        </td>
        <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.display}</td>
      </tr>
    );
  });

  return elements;
}

export default function RankingPage({ players, stats, games, initialYear }) {
  const years = [...new Set(games.map((g) => parseInt(g.date.slice(0, 4), 10)))]
    .sort((a, b) => b - a);
  if (years.length === 0) years.push(initialYear ?? new Date().getFullYear());
  const [year, setYear] = useState(years[0]);
  const [tab, setTab] = useState('bat');
  const [batCat, setBatCat] = useState('avg');
  const [pitCat, setPitCat] = useState('era');
  const [expand, setExpand] = useState(false);

  const rankings = buildRankings(players, stats, games, year);
  const record = buildTeamRecord(games, year);
  const { BAT_CATS, PIT_CATS, qualifiedPA, qualifiedIPOuts, gameCount } = rankings;

  const currentCat = tab === 'bat'
    ? BAT_CATS.find((c) => c.key === batCat)
    : PIT_CATS.find((c) => c.key === pitCat);

  const catData = (tab === 'bat' ? rankings.bat[batCat] : rankings.pit[pitCat]) ?? { qualified: [], unqualified: [] };
  const { qualified = [], unqualified = [] } = catData;
  const hasUnqualified = unqualified.length > 0;
  const needsQualHint = currentCat?.needsQualified || currentCat?.needsQualifiedIP;

  const displayRows = expand
    ? [...qualified, ...unqualified]
    : qualified.slice(0, DISPLAY_N);

  const showExpandBtn = qualified.length > DISPLAY_N || (hasUnqualified && needsQualHint);

  return (
    <div>
      <div className="year-toolbar">
        {years.map((y) => (
          <button key={y} onClick={() => setYear(y)} className={y === year ? 'active' : ''}>
            {y}年
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 12 }}>
        <div className="team-stats" style={{ padding: '12px 8px' }}>
          {[['勝', 'w', record.win], ['負', 'l', record.lose], ['分', 'd', record.draw]].map(([lbl, cls, v]) => (
            <div key={cls}>
              <div className="val">{v}</div>
              <div className="lbl">{lbl}</div>
            </div>
          ))}
          <div>
            <div className="val" style={{ fontSize: '1.05rem' }}>{record.winPct}</div>
            <div className="lbl">勝率</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button onClick={() => setTab('bat')} className={tab === 'bat' ? 'active' : ''}>野手</button>
        <button onClick={() => setTab('pit')} className={tab === 'pit' ? 'active' : ''}>投手</button>
      </div>

      <div className="cat-tabs">
        {(tab === 'bat' ? BAT_CATS : PIT_CATS).map((c) => (
          <button
            key={c.key}
            onClick={() => { tab === 'bat' ? setBatCat(c.key) : setPitCat(c.key); setExpand(false); }}
            className={(tab === 'bat' ? batCat : pitCat) === c.key ? 'active' : ''}
          >
            {c.label}
          </button>
        ))}
      </div>

      {tab === 'bat' && gameCount > 0 && (
        <p className="hint" style={{ marginBottom: 6 }}>
          {currentCat?.needsQualified
            ? `※ 規定打席（${qualifiedPA}打席＝${gameCount}試合×${QUALIFIED_PA_PER_GAME}）達成選手が上位表示`
            : '※ 全選手対象'}
          {currentCat?.needsQualified && hasUnqualified && expand && '／未到達は下に表示'}
        </p>
      )}
      {tab === 'pit' && gameCount > 0 && (
        <p className="hint" style={{ marginBottom: 6 }}>
          {currentCat?.needsQualifiedIP
            ? `※ 規定投球回（${outsToIp(qualifiedIPOuts)}回＝${gameCount}試合×${QUALIFIED_IP_PER_GAME}）達成選手が上位表示`
            : '※ 全選手対象'}
          {currentCat?.needsQualifiedIP && hasUnqualified && expand && '／未到達は下に表示'}
        </p>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="rank-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>順</th>
              <th>選手</th>
              <th style={{ textAlign: 'right' }}>{currentCat?.label ?? ''}</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <p className="hint" style={{ textAlign: 'center', padding: '24px 0' }}>データがありません</p>
                </td>
              </tr>
            ) : (
              <RankingRows
                rows={displayRows}
                showUnqualifiedLabel={expand && needsQualHint}
              />
            )}
          </tbody>
        </table>
      </div>

      {showExpandBtn && (
        <button
          className="btn btn-sm btn-outline"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => setExpand((v) => !v)}
        >
          {expand
            ? '▲ 閉じる'
            : `▼ もっと見る（規定内${qualified.length}件${hasUnqualified && needsQualHint ? `＋未到達${unqualified.length}件` : ''}）`}
        </button>
      )}
    </div>
  );
}
