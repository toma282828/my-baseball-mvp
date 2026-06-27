'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildRankings, buildTeamRecord, fmtJersey, QUALIFIED_PA_PER_GAME, QUALIFIED_IP_PER_GAME, outsToIp } from '@/lib/stats';

const DISPLAY_N = 5;

export default function RankingPage({ players, stats, games, initialYear }) {
  const years = [...new Set(games.map((g) => parseInt(g.date.slice(0, 4), 10)))]
    .sort((a, b) => b - a);
  if (years.length === 0) years.push(initialYear ?? new Date().getFullYear());
  const [year, setYear] = useState(years[0]);
  const [tab,    setTab]    = useState('bat');
  const [batCat, setBatCat] = useState('avg');
  const [pitCat, setPitCat] = useState('era');
  const [expand, setExpand] = useState(false);

  const rankings = buildRankings(players, stats, games, year);
  const record   = buildTeamRecord(games, year);
  const { BAT_CATS, PIT_CATS, qualifiedPA, qualifiedIPOuts, gameCount } = rankings;

  const currentCat = tab === 'bat'
    ? BAT_CATS.find((c) => c.key === batCat)
    : PIT_CATS.find((c) => c.key === pitCat);

  const rows       = (tab === 'bat' ? rankings.bat[batCat] : rankings.pit[pitCat]) ?? [];
  const displayRows = expand ? rows : rows.slice(0, DISPLAY_N);

  return (
    <div>
      {/* 年選択 */}
      <div className="year-toolbar">
        {years.map((y) => (
          <button key={y} onClick={() => setYear(y)} className={y === year ? 'active' : ''}>
            {y}年
          </button>
        ))}
      </div>

      {/* チーム成績 */}
      <div className="card" style={{padding:0,marginBottom:12}}>
        <div className="team-stats" style={{padding:'12px 8px'}}>
          {[['勝','w',record.win],['負','l',record.lose],['分','d',record.draw]].map(([lbl,cls,v])=>(
            <div key={cls}>
              <div className="val">{v}</div>
              <div className="lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* メインタブ */}
      <div className="tabs">
        <button onClick={() => setTab('bat')} className={tab === 'bat' ? 'active' : ''}>野手</button>
        <button onClick={() => setTab('pit')} className={tab === 'pit' ? 'active' : ''}>投手</button>
      </div>

      {/* カテゴリタブ */}
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

      {/* 規定打席/投球回ヒント */}
      {tab === 'bat' && gameCount > 0 && (
        <p className="hint" style={{marginBottom:6}}>
          {currentCat?.needsQualified
            ? `※ 規定打席（${qualifiedPA}打席＝${gameCount}試合×${QUALIFIED_PA_PER_GAME}）達成選手のみ`
            : '※ 全選手対象'}
        </p>
      )}
      {tab === 'pit' && gameCount > 0 && (
        <p className="hint" style={{marginBottom:6}}>
          {currentCat?.needsQualifiedIP
            ? `※ 規定投球回（${outsToIp(qualifiedIPOuts)}回＝${gameCount}試合×${QUALIFIED_IP_PER_GAME}）達成選手のみ`
            : '※ 全選手対象'}
        </p>
      )}

      {/* ランキング表 */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {displayRows.length === 0 ? (
          <p className="hint" style={{textAlign:'center',padding:'24px 0'}}>データがありません</p>
        ) : (
          <table className="rank-table">
            <thead>
              <tr>
                <th style={{width:28}}>順</th>
                <th>選手</th>
                <th style={{textAlign:'right'}}>{currentCat?.label ?? ''}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={row.name}>
                  <td className={row.rank === 1 ? 'rank-1' : ''}>{row.rank}</td>
                  <td>
                    <Link href={`/players/${encodeURIComponent(row.name)}`} style={{textDecoration:'none',color:'inherit'}}>
                      <span style={{color:'#aaa',fontSize:'.75rem',marginRight:4}}>
                        #{fmtJersey(row.jersey_num, row.jersey_double_zero)}
                      </span>
                      {row.name}
                    </Link>
                  </td>
                  <td style={{textAlign:'right',fontWeight:600}}>{row.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > DISPLAY_N && (
        <button className="btn btn-sm btn-outline" style={{marginTop:8,width:'100%'}}
          onClick={() => setExpand((v) => !v)}>
          {expand ? '▲ 閉じる' : `▼ もっと見る（全${rows.length}件）`}
        </button>
      )}
    </div>
  );
}
