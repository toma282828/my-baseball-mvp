'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildRankings, buildTeamRecord, fmtJersey } from '@/lib/stats';

const PREVIEW = 5;

export default function RankingPage({ players, games, stats, initialYear }) {
  const [year, setYear] = useState(initialYear);
  const [tab, setTab] = useState('bat');
  const [batCat, setBatCat] = useState('avg');
  const [pitCat, setPitCat] = useState('era');
  const [expanded, setExpanded] = useState(false);

  const rankings = buildRankings(players, stats, games, year);
  const record = buildTeamRecord(games, year);
  const { BAT_CATS, PIT_CATS, qualifiedPA, gameCount } = rankings;
  const currentCatObj = (tab === 'bat' ? BAT_CATS : PIT_CATS).find(c => c.key === (tab === 'bat' ? batCat : pitCat));

  const currentCats = tab === 'bat' ? BAT_CATS : PIT_CATS;
  const currentCat = tab === 'bat' ? batCat : pitCat;
  const rows = tab === 'bat' ? (rankings.bat[batCat] ?? []) : (rankings.pit[pitCat] ?? []);
  const displayRows = expanded ? rows : rows.slice(0, PREVIEW);

  const years = [];
  const gameYears = games.map((g) => parseInt(g.date.slice(0, 4)));
  const minYear = gameYears.length ? Math.min(...gameYears) : initialYear;
  for (let y = initialYear; y >= Math.max(minYear, initialYear - 5); y--) years.push(y);

  return (
    <div>
      {/* 年度セレクタ */}
      <div className="year-toolbar">
        {years.map((y) => (
          <button key={y} onClick={() => { setYear(y); setExpanded(false); }}
            className={y === year ? 'active' : ''}>
            {y}年
          </button>
        ))}
      </div>

      {/* チーム成績 */}
      <div className="card">
        <div className="team-stats">
          <div>
            <div className="val">{record.win}</div>
            <div className="lbl">勝利</div>
          </div>
          <div>
            <div className="val">{record.lose}</div>
            <div className="lbl">敗戦</div>
          </div>
          <div>
            <div className="val">{record.winPct}</div>
            <div className="lbl">勝率</div>
          </div>
        </div>
        <p className="hint" style={{textAlign:'center',marginTop:8}}>{year}年度 チーム成績（{record.total}試合）</p>
      </div>

      {/* 打撃/投手タブ */}
      <div className="tabs">
        {[['bat','打撃'],['pit','投手']].map(([t, lbl]) => (
          <button key={t} onClick={() => { setTab(t); setExpanded(false); }}
            className={tab === t ? 'active' : ''}>{lbl}</button>
        ))}
      </div>

      {/* 部門タブ */}
      <div className="cat-tabs">
        {currentCats.map((cat) => (
          <button key={cat.key}
            onClick={() => { tab === 'bat' ? setBatCat(cat.key) : setPitCat(cat.key); setExpanded(false); }}
            className={currentCat === cat.key ? 'active' : ''}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 規定打席・ランキング表 */}
      {tab === 'bat' && gameCount > 0 && (
        <p className="hint" style={{marginBottom:6}}>
          {currentCatObj?.needsQualified
            ? `※ 規定打席（${qualifiedPA}打席＝${gameCount}試合×2）に達した選手のみ表示`
            : '※ 全選手対象（規定打席不問）'}
        </p>
      )}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {displayRows.length === 0 ? (
          <p className="hint" style={{textAlign:'center',padding:'24px 0'}}>
            {tab === 'bat' && currentCatObj?.needsQualified && gameCount > 0
              ? `規定打席（${qualifiedPA}打席）に達した選手がいません`
              : 'データがありません'}
          </p>
        ) : (
          <table className="rank-table">
            <thead>
              <tr>
                <th style={{width:32}}>順位</th>
                <th>選手</th>
                <th style={{textAlign:'right'}}>{currentCats.find(c=>c.key===currentCat)?.label}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.name}>
                  <td style={{color:'#999',fontWeight:600}}>{r.rank}</td>
                  <td>
                    <Link href={`/players/${encodeURIComponent(r.name)}`} className="player-link">
                      <span style={{fontSize:'.7rem',color:'#aaa',marginRight:4}}>
                        #{fmtJersey(r.jersey_num, r.jersey_double_zero)}
                      </span>
                      {r.name}
                    </Link>
                  </td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--green-700)'}}>
                    {r.display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > PREVIEW && (
        <button className="btn btn-outline expand-btn"
          onClick={() => setExpanded(!expanded)}>
          {expanded ? '上位5人だけ表示' : `全${rows.length}人を見る`}
        </button>
      )}
    </div>
  );
}
