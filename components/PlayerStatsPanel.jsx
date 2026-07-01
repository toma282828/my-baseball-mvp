'use client';

import { useState } from 'react';
import { fmtAvg, fmtEra, outsToIp } from '@/lib/stats';

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ margin: 0, padding: '10px 12px' }}>
      <span className="lbl">{label}</span>
      <span className="val">{value ?? '—'}</span>
    </div>
  );
}

function BattingGrid({ bat }) {
  return (
    <div className="stat-grid">
      <StatCard label="打率" value={fmtAvg(bat.avg)} />
      <StatCard label="安打" value={bat.hit} />
      <StatCard label="打数" value={bat.ab} />
      <StatCard label="打席数" value={bat.pa} />
      <StatCard label="本塁打" value={bat.hr} />
      <StatCard label="打点" value={bat.rbi} />
      <StatCard label="得点" value={bat.run_scored} />
      <StatCard label="塁打" value={bat.tb} />
      <StatCard label="盗塁" value={bat.sb} />
      <StatCard label="盗塁死" value={bat.cs} />
      <StatCard label="四死球" value={bat.bb} />
      <StatCard label="三振" value={bat.so_bat} />
      <StatCard label="犠打" value={bat.bunt} />
      <StatCard label="犠飛" value={bat.sf} />
      <StatCard label="二塁打" value={bat.s2} />
      <StatCard label="三塁打" value={bat.s3} />
      <StatCard label="出塁率" value={fmtAvg(bat.obp)} />
      <StatCard label="長打率" value={fmtAvg(bat.slg)} />
      <StatCard label="OPS" value={bat.ops?.toFixed(3) ?? '—'} />
      {bat.risp_ab > 0 && (
        <StatCard label="得点圏打率" value={`${fmtAvg(bat.risp_avg)}（${bat.risp_hit}/${bat.risp_ab}）`} />
      )}
    </div>
  );
}

function PitchingGrid({ pit }) {
  return (
    <div className="stat-grid">
      <StatCard label="防御率" value={fmtEra(pit.era)} />
      <StatCard label="勝率" value={pit.win_pct != null ? fmtAvg(pit.win_pct) : '—'} />
      <StatCard label="勝利" value={pit.win} />
      <StatCard label="敗戦" value={pit.lose} />
      <StatCard label="セーブ" value={pit.sv} />
      <StatCard label="ホールド" value={pit.hold} />
      <StatCard label="HP" value={pit.hp} />
      <StatCard label="奪三振" value={pit.so} />
      <StatCard label="投球回" value={outsToIp(pit.ipOuts)} />
      <StatCard label="登板数" value={pit.appearances} />
      <StatCard label="先発" value={pit.starts} />
      <StatCard label="リリーフ" value={pit.reliefs} />
      <StatCard label="完投" value={pit.cg} />
      <StatCard label="完封" value={pit.sho} />
      <StatCard label="被安打" value={pit.h_allowed} />
      <StatCard label="被本塁打" value={pit.hr_allowed} />
      <StatCard label="与四死球" value={pit.bb_allowed} />
      <StatCard label="失点" value={pit.r_allowed} />
      <StatCard label="自責点" value={pit.er} />
    </div>
  );
}

export default function PlayerStatsPanel({ totalBat, totalPit, hasBat, hasPit, yearlyStats }) {
  const [tab, setTab] = useState('total');

  if (!hasBat && !hasPit) {
    return <p className="hint" style={{ textAlign: 'center', padding: '24px 0' }}>成績データがありません</p>;
  }

  return (
    <>
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => setTab('total')} className={tab === 'total' ? 'active' : ''}>
          通算
        </button>
        <button type="button" onClick={() => setTab('yearly')} className={tab === 'yearly' ? 'active' : ''}>
          年度別
        </button>
      </div>

      {tab === 'total' && (
        <>
          {hasBat && (
            <>
              <h3>打撃成績（通算）</h3>
              <BattingGrid bat={totalBat} />
            </>
          )}
          {hasPit && (
            <>
              <h3>投手成績（通算）</h3>
              <PitchingGrid pit={totalPit} />
            </>
          )}
        </>
      )}

      {tab === 'yearly' && (
        <>
          {yearlyStats.length === 0 ? (
            <p className="hint" style={{ textAlign: 'center', padding: '24px 0' }}>年度別データがありません</p>
          ) : (
            yearlyStats.map(({ year, bat, pit, hasBat: yBat, hasPit: yPit }) => (
              <div key={year} className="card" style={{ marginBottom: 12, padding: '12px 14px' }}>
                <h3 style={{ marginBottom: 10, fontSize: '1rem' }}>{year}年</h3>
                {yBat && (
                  <>
                    <p className="hint" style={{ marginBottom: 6, fontWeight: 700 }}>打撃</p>
                    <BattingGrid bat={bat} />
                  </>
                )}
                {yPit && (
                  <>
                    <p className="hint" style={{ margin: yBat ? '12px 0 6px' : '0 0 6px', fontWeight: 700 }}>投手</p>
                    <PitchingGrid pit={pit} />
                  </>
                )}
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
