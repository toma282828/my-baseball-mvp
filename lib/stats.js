/** ip_outs（アウト数）→ 投球回表示 "3.1" 形式 */
export function outsToIp(outs) {
  if (!outs) return '0.0';
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

/** "3.1" 形式 → アウト数 */
export function ipToOuts(ipStr) {
  if (!ipStr) return 0;
  const [whole, frac] = String(ipStr).split('.');
  return parseInt(whole || 0) * 3 + parseInt(frac || 0);
}

function calcAvg(hit, ab) { return ab ? hit / ab : null; }
function calcObp(hit, bb, ab) {
  const d = ab + bb; return d ? (hit + bb) / d : null;
}
function calcSlg(s1, s2, s3, hr, ab) {
  return ab ? (s1 + s2 * 2 + s3 * 3 + hr * 4) / ab : null;
}
function calcEra(er, ipOuts) { return ipOuts ? (er * 27) / ipOuts : null; }

export function fmtAvg(val) {
  if (val == null) return '—';
  const s = val.toFixed(3);
  return s.startsWith('0') ? s.slice(1) : s;
}
export function fmtEra(val) {
  if (val == null) return '—';
  return val.toFixed(2);
}

export function aggregateBatting(statRows) {
  let ab=0,s1=0,s2=0,s3=0,hr=0,rbi=0,sb=0,bb=0;
  let run_scored=0,so_bat=0,bunt=0,sf=0,cs=0,risp_ab=0,risp_hit=0;
  for (const r of statRows) {
    ab += r.ab ?? 0; s1 += r.s1 ?? 0; s2 += r.s2 ?? 0; s3 += r.s3 ?? 0;
    hr += r.hr ?? 0; rbi += r.rbi ?? 0; sb += r.sb ?? 0; bb += r.bb ?? 0;
    run_scored += r.run_scored ?? 0; so_bat += r.so_bat ?? 0;
    bunt += r.bunt ?? 0; sf += r.sf ?? 0; cs += r.cs ?? 0;
    risp_ab += r.risp_ab ?? 0; risp_hit += r.risp_hit ?? 0;
  }
  const hit = s1 + s2 + s3 + hr;
  const tb  = s1 + s2*2 + s3*3 + hr*4;
  const pa  = ab + bb + bunt + sf;
  const avg = calcAvg(hit, ab);
  const obp = calcObp(hit, bb, ab);
  const slg = calcSlg(s1, s2, s3, hr, ab);
  const ops = obp != null && slg != null ? obp + slg : null;
  const risp_avg = risp_ab > 0 ? risp_hit / risp_ab : null;
  return { ab, hit, s1, s2, s3, hr, rbi, sb, bb, avg, obp, slg, ops,
           run_scored, so_bat, bunt, sf, cs, risp_ab, risp_hit, risp_avg, tb, pa };
}

export function aggregatePitching(statRows) {
  let ipOuts=0,so=0,er=0,win=0,lose=0,sv=0;
  let h_allowed=0,hr_allowed=0,bb_allowed=0,r_allowed=0;
  let appearances=0,starts=0,cg_count=0,sho_count=0,hold=0,relief_wins=0;
  for (const r of statRows) {
    const pitched = (r.ip_outs ?? 0) > 0 || r.decision;
    if (pitched) {
      appearances++;
      if (r.is_start)         starts++;
      if (r.cg)               cg_count++;
      if (r.sho)              sho_count++;
      if (r.decision === 'ホールド') hold++;
      if (r.decision === '勝ち' && !r.is_start) relief_wins++;
    }
    ipOuts     += r.ip_outs ?? 0;
    so         += r.so_p ?? 0;
    er         += r.er ?? 0;
    if (r.decision === '勝ち')    win++;
    if (r.decision === '負け')    lose++;
    if (r.decision === 'セーブ')  sv++;
    h_allowed  += r.h_allowed  ?? 0;
    hr_allowed += r.hr_allowed ?? 0;
    bb_allowed += r.bb_allowed ?? 0;
    r_allowed  += r.r_allowed  ?? 0;
  }
  const era      = calcEra(er, ipOuts);
  const reliefs  = appearances - starts;
  const hp       = hold + relief_wins;          // HP = ホールド + リリーフ勝利
  const win_pct  = (win + lose) > 0 ? win / (win + lose) : null;
  return { ipOuts, so, er, win, lose, sv, era, hold, hp,
           h_allowed, hr_allowed, bb_allowed, r_allowed,
           appearances, starts, reliefs, cg: cg_count, sho: sho_count, win_pct };
}

export const QUALIFIED_PA_PER_GAME = 2;   // 1試合あたりの規定打席
export const QUALIFIED_IP_PER_GAME = 1;   // 1試合あたりの規定投球回（innings）

export function buildRankings(players, allStats, games, year) {
  const yearGamesList = games.filter((g) => g.date.startsWith(String(year)));
  const yearGames     = new Set(yearGamesList.map((g) => g.id));
  const gameCount     = yearGamesList.length;
  const qualifiedPA   = gameCount * QUALIFIED_PA_PER_GAME;
  const qualifiedIPOuts = gameCount * QUALIFIED_IP_PER_GAME * 3;

  const yearStats = allStats.filter((s) => yearGames.has(s.game_id));
  const byPlayer  = {};
  for (const s of yearStats) {
    if (!byPlayer[s.player_name]) byPlayer[s.player_name] = [];
    byPlayer[s.player_name].push(s);
  }

  const batData = [], pitData = [];
  for (const p of players) {
    const rows = byPlayer[p.name] || [];
    if (rows.some((r) => r.ab > 0)) {
      const bat = aggregateBatting(rows);
      const pa  = bat.ab + bat.bb + bat.bunt + bat.sf;
      batData.push({ ...p, ...bat, pa, qualified: pa >= qualifiedPA });
    }
    if (rows.some((r) => r.ip_outs > 0 || r.decision)) {
      const pit = aggregatePitching(rows);
      pitData.push({ ...p, ...pit, qualifiedIP: pit.ipOuts >= qualifiedIPOuts });
    }
  }

  const BAT_CATS = [
    { key:'avg',       label:'打率',       val:(r)=>r.avg,        fmt:fmtAvg,                        desc:true,  needsQualified:true  },
    { key:'hit',       label:'安打',       val:(r)=>r.hit,        fmt:String,                        desc:true,  needsQualified:false },
    { key:'tb',        label:'塁打',       val:(r)=>r.tb,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'hr',        label:'本塁打',     val:(r)=>r.hr,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'rbi',       label:'打点',       val:(r)=>r.rbi,        fmt:String,                        desc:true,  needsQualified:false },
    { key:'run_scored',label:'得点',       val:(r)=>r.run_scored, fmt:String,                        desc:true,  needsQualified:false },
    { key:'sb',        label:'盗塁',       val:(r)=>r.sb,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'bb',        label:'四死球',     val:(r)=>r.bb,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'s2',        label:'二塁打',     val:(r)=>r.s2,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'s3',        label:'三塁打',     val:(r)=>r.s3,         fmt:String,                        desc:true,  needsQualified:false },
    { key:'obp',       label:'出塁率',     val:(r)=>r.obp,        fmt:fmtAvg,                        desc:true,  needsQualified:true  },
    { key:'slg',       label:'長打率',     val:(r)=>r.slg,        fmt:fmtAvg,                        desc:true,  needsQualified:true  },
    { key:'ops',       label:'OPS',        val:(r)=>r.ops,        fmt:(v)=>v?.toFixed(3)??'—',       desc:true,  needsQualified:true  },
    { key:'risp_avg',  label:'得点圏打率', val:(r)=>r.risp_avg,   fmt:fmtAvg,                        desc:true,  needsQualified:false, needsRisp:true },
  ];

  const PIT_CATS = [
    { key:'era',        label:'防御率',   val:(r)=>r.era,        fmt:fmtEra,                        desc:false, needsQualifiedIP:true  },
    { key:'win',        label:'勝利',     val:(r)=>r.win,        fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'win_pct',    label:'勝率',     val:(r)=>r.win_pct,    fmt:fmtAvg,                        desc:true,  needsQualifiedIP:true  },
    { key:'lose',       label:'敗戦',     val:(r)=>r.lose,       fmt:String,                        desc:false, needsQualifiedIP:false },
    { key:'so',         label:'奪三振',   val:(r)=>r.so,         fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'ipOuts',     label:'投球回',   val:(r)=>r.ipOuts,     fmt:outsToIp,                      desc:true,  needsQualifiedIP:false },
    { key:'sv',         label:'セーブ',   val:(r)=>r.sv,         fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'hold',       label:'ホールド', val:(r)=>r.hold,       fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'hp',         label:'HP',       val:(r)=>r.hp,         fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'appearances',label:'登板数',   val:(r)=>r.appearances,fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'cg',         label:'完投',     val:(r)=>r.cg,         fmt:String,                        desc:true,  needsQualifiedIP:false },
    { key:'sho',        label:'完封',     val:(r)=>r.sho,        fmt:String,                        desc:true,  needsQualifiedIP:false },
  ];

  function makeRanking(data, cats) {
    const result = {};
    for (const cat of cats) {
      let eligible = data;
      if (cat.needsQualified)   eligible = data.filter((r) => r.qualified);
      if (cat.needsQualifiedIP) eligible = data.filter((r) => r.qualifiedIP);
      if (cat.needsRisp)        eligible = data.filter((r) => (r.risp_ab ?? 0) > 0);
      const sorted = [...eligible]
        .filter((r) => cat.val(r) != null && cat.val(r) !== 0)
        .sort((a, b) => {
          const va = cat.val(a) ?? -Infinity, vb = cat.val(b) ?? -Infinity;
          return cat.desc ? vb - va : va - vb;
        });
      result[cat.key] = sorted.map((r, i) => ({
        rank: i + 1, name: r.name,
        jersey_num: r.jersey_num, jersey_double_zero: r.jersey_double_zero,
        value: cat.val(r), display: cat.fmt(cat.val(r)),
      }));
    }
    return result;
  }

  return {
    bat: makeRanking(batData, BAT_CATS),
    pit: makeRanking(pitData, PIT_CATS),
    BAT_CATS, PIT_CATS, qualifiedPA, qualifiedIPOuts, gameCount,
  };
}

export function fmtJersey(num, doubleZero) {
  if (doubleZero) return '00';
  return String(num).padStart(1, '0');
}

export function buildTeamRecord(games, year) {
  const yearGames = games.filter((g) => g.date.startsWith(String(year)));
  const win   = yearGames.filter((g) => g.result === 'win').length;
  const lose  = yearGames.filter((g) => g.result === 'lose').length;
  const draw  = yearGames.filter((g) => g.result === 'draw').length;
  const total = yearGames.length;
  const winPct = total ? (win / total).toFixed(3).replace(/^0/, '') : '—';
  return { win, lose, draw, total, winPct };
}

export function buildAllAwards(players, allStats, games, currentYear) {
  // バッジあり + MVP カウント対象
  const BAT_TITLE_BADGE = {
    avg:'首位打者', hr:'本塁打王', rbi:'打点王', sb:'盗塁王', hit:'最多安打',
  };
  // MVP カウントのみ（バッジなし）
  const BAT_TITLE_MVP_ONLY = {
    tb:'塁打王', run_scored:'得点王', bb:'四死球王', s2:'二塁打王', s3:'三塁打王',
  };

  // バッジあり + エース カウント対象（敗戦は除外）
  const PIT_TITLE_BADGE = {
    era:'最優秀防御率', win:'最多勝', so:'最多奪三振', ipOuts:'最多投球回', win_pct:'最高勝率',
  };
  // エース カウントのみ（バッジなし）
  const PIT_TITLE_ACE_ONLY = {
    appearances:'登板数王', cg:'完投王', sho:'完封王',
  };

  const years = [
    ...new Set(games.map((g) => parseInt(g.date.slice(0, 4), 10))),
  ].filter((y) => y < currentYear).sort((a, b) => a - b);

  const awards = {};
  function addAward(name, year, label, golden=false, kind='') {
    if (!awards[name]) awards[name] = [];
    if (!awards[name].some((a) => a.year === year && a.label === label))
      awards[name].push({ year, label, golden, kind });
  }

  for (const year of years) {
    const yearGameIds = new Set(
      games.filter((g) => g.date.startsWith(String(year))).map((g) => g.id)
    );
    const yearStats = allStats.filter((s) => yearGameIds.has(s.game_id));
    const gameCount = yearGameIds.size;
    const qualifiedIPOuts = gameCount * QUALIFIED_IP_PER_GAME * 3;

    const byPlayer = {};
    for (const s of yearStats) {
      if (!byPlayer[s.player_name]) byPlayer[s.player_name] = [];
      byPlayer[s.player_name].push(s);
    }

    const batData = [], pitData = [];
    for (const p of players) {
      const rows = byPlayer[p.name] || [];
      if (rows.some((r) => r.ab > 0)) {
        const bat = aggregateBatting(rows);
        batData.push({ name: p.name, ...bat });
      }
      if (rows.some((r) => r.ip_outs > 0 || r.decision)) {
        const pit = aggregatePitching(rows);
        pitData.push({ name: p.name, ...pit });
      }
    }

    const batWinCount = {}, aceWinCount = {};

    // ── 打撃タイトル（バッジあり + MVP カウント） ──
    function processBatTitle(titleMap, giveBadge) {
      for (const [key, label] of Object.entries(titleMap)) {
        // era 方向（昇順）はないので全部降順
        const sorted = [...batData]
          .filter((r) => r[key] != null && r[key] > 0)
          .sort((a, b) => b[key] - a[key]);
        if (!sorted.length) continue;
        const top = sorted[0][key];
        sorted.filter((r) => r[key] === top).forEach((r) => {
          if (giveBadge) addAward(r.name, year, `${year} ${label}`);
          batWinCount[r.name] = (batWinCount[r.name] || 0) + 1;
        });
      }
    }
    processBatTitle(BAT_TITLE_BADGE,    true);
    processBatTitle(BAT_TITLE_MVP_ONLY, false);

    // 得点圏打率（MVP カウントのみ、risp_ab > 0 の選手対象）
    {
      const eligible = batData.filter((r) => (r.risp_ab ?? 0) > 0);
      if (eligible.length) {
        const sorted = [...eligible].sort((a, b) => (b.risp_avg ?? 0) - (a.risp_avg ?? 0));
        const top = sorted[0].risp_avg;
        sorted.filter((r) => r.risp_avg === top).forEach((r) => {
          batWinCount[r.name] = (batWinCount[r.name] || 0) + 1;
        });
      }
    }

    // ── 投手タイトル（バッジあり + エース カウント） ──
    function processPitTitle(titleMap, giveBadge) {
      for (const [key, label] of Object.entries(titleMap)) {
        const desc = key !== 'era';
        const eligible = key === 'era' || key === 'win_pct'
          ? pitData.filter((r) => r.ipOuts >= qualifiedIPOuts)
          : pitData;
        const sorted = [...eligible]
          .filter((r) => r[key] != null && r[key] > 0)
          .sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]);
        if (!sorted.length) continue;
        const top = sorted[0][key];
        sorted.filter((r) => r[key] === top).forEach((r) => {
          if (giveBadge) addAward(r.name, year, `${year} ${label}`);
          aceWinCount[r.name] = (aceWinCount[r.name] || 0) + 1;
        });
      }
    }
    processPitTitle(PIT_TITLE_BADGE,    true);
    processPitTitle(PIT_TITLE_ACE_ONLY, false);

    // MVP（最多打撃タイトル）
    const maxBat = Math.max(0, ...Object.values(batWinCount));
    if (maxBat > 0) Object.entries(batWinCount).filter(([,c])=>c===maxBat)
      .forEach(([name])=>addAward(name, year, `${year} MVP`, true, 'mvp'));

    // エース（エース対象タイトル最多）
    const maxAce = Math.max(0, ...Object.values(aceWinCount));
    if (maxAce > 0) Object.entries(aceWinCount).filter(([,c])=>c===maxAce)
      .forEach(([name])=>addAward(name, year, `${year} エース`, true, 'ace'));

    // セーブ王（独立ゴールドバッジ）
    const svSorted = [...pitData].filter((r)=>r.sv>0).sort((a,b)=>b.sv-a.sv);
    if (svSorted.length) {
      const top = svSorted[0].sv;
      svSorted.filter((r)=>r.sv===top).forEach((r)=>
        addAward(r.name, year, `${year} セーブ王`, true, 'sv'));
    }

    // 最優秀中継ぎ（HP最多、独立ゴールドバッジ）
    const hpSorted = [...pitData].filter((r)=>r.hp>0).sort((a,b)=>b.hp-a.hp);
    if (hpSorted.length) {
      const top = hpSorted[0].hp;
      hpSorted.filter((r)=>r.hp===top).forEach((r)=>
        addAward(r.name, year, `${year} 最優秀中継ぎ`, false, 'relief'));
    }
  }

  for (const name of Object.keys(awards)) {
    const order = { mvp:0, ace:1, sv:2, relief:3 };
    awards[name].sort((a, b) => {
      if (!!a.golden !== !!b.golden) return a.golden ? -1 : 1;
      if (a.golden && b.golden) {
        if (b.year !== a.year) return b.year - a.year;
        return (order[a.kind]??9) - (order[b.kind]??9);
      }
      return b.year - a.year || a.label.localeCompare(b.label);
    });
  }
  return awards;
}
