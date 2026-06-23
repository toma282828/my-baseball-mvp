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

/** 打率（3桁小数） */
function calcAvg(hit, ab) {
  if (!ab) return null;
  return hit / ab;
}

/** 出塁率 */
function calcObp(hit, bb, ab) {
  const denom = ab + bb;
  if (!denom) return null;
  return (hit + bb) / denom;
}

/** 長打率 */
function calcSlg(s1, s2, s3, hr, ab) {
  if (!ab) return null;
  return (s1 + s2 * 2 + s3 * 3 + hr * 4) / ab;
}

/** 防御率 */
function calcEra(er, ipOuts) {
  if (!ipOuts) return null;
  return (er * 27) / ipOuts;
}

/** 小数を ".xxx" 表示にする */
export function fmtAvg(val) {
  if (val == null) return '—';
  const s = val.toFixed(3);
  return s.startsWith('0') ? s.slice(1) : s;
}

/** 小数を "X.XX" 表示にする（防御率など） */
export function fmtEra(val) {
  if (val == null) return '—';
  return val.toFixed(2);
}

/**
 * game_stats の配列（1選手分の全試合）から累計打撃成績を計算して返す
 */
export function aggregateBatting(statRows) {
  let ab = 0, s1 = 0, s2 = 0, s3 = 0, hr = 0, rbi = 0, sb = 0, bb = 0;
  for (const r of statRows) {
    ab += r.ab ?? 0;
    s1 += r.s1 ?? 0;
    s2 += r.s2 ?? 0;
    s3 += r.s3 ?? 0;
    hr += r.hr ?? 0;
    rbi += r.rbi ?? 0;
    sb += r.sb ?? 0;
    bb += r.bb ?? 0;
  }
  const hit = s1 + s2 + s3 + hr;
  const avg = calcAvg(hit, ab);
  const obp = calcObp(hit, bb, ab);
  const slg = calcSlg(s1, s2, s3, hr, ab);
  const ops = obp != null && slg != null ? obp + slg : null;
  return { ab, hit, s1, s2, s3, hr, rbi, sb, bb, avg, obp, slg, ops };
}

/**
 * game_stats の配列（1選手分の全試合）から累計投手成績を計算して返す
 */
export function aggregatePitching(statRows) {
  let ipOuts = 0, so = 0, er = 0, win = 0, lose = 0, sv = 0;
  for (const r of statRows) {
    ipOuts += r.ip_outs ?? 0;
    so += r.so_p ?? 0;
    er += r.er ?? 0;
    if (r.decision === '勝ち') win++;
    if (r.decision === '負け') lose++;
    if (r.decision === 'セーブ') sv++;
  }
  const era = calcEra(er, ipOuts);
  return { ipOuts, so, er, win, lose, sv, era };
}

/**
 * 指定年度の試合に絞った game_stats を集計してランキング用データを作る。
 * players: [{ name, jersey_num, jersey_double_zero, position }]
 * allStats: [{ game_id, player_name, ab, ...  }]
 * games: [{ id, date, result, ... }]
 */
export function buildRankings(players, allStats, games, year) {
  const yearGames = new Set(
    games
      .filter((g) => g.date.startsWith(String(year)))
      .map((g) => g.id)
  );

  const yearStats = allStats.filter((s) => yearGames.has(s.game_id));

  const byPlayer = {};
  for (const s of yearStats) {
    if (!byPlayer[s.player_name]) byPlayer[s.player_name] = [];
    byPlayer[s.player_name].push(s);
  }

  const batData = [];
  const pitData = [];

  for (const p of players) {
    const rows = byPlayer[p.name] || [];
    const hasBat = rows.some((r) => r.ab > 0);
    const hasPit = rows.some((r) => r.ip_outs > 0 || r.decision);

    if (hasBat) {
      const bat = aggregateBatting(rows);
      batData.push({ ...p, ...bat });
    }
    if (hasPit) {
      const pit = aggregatePitching(rows);
      pitData.push({ ...p, ...pit });
    }
  }

  const BAT_CATS = [
    { key: 'avg',  label: '打率',   val: (r) => r.avg,  fmt: fmtAvg, desc: true },
    { key: 'hit',  label: '安打',   val: (r) => r.hit,  fmt: String, desc: true },
    { key: 's2',   label: '二塁打', val: (r) => r.s2,   fmt: String, desc: true },
    { key: 's3',   label: '三塁打', val: (r) => r.s3,   fmt: String, desc: true },
    { key: 'hr',   label: '本塁打', val: (r) => r.hr,   fmt: String, desc: true },
    { key: 'rbi',  label: '打点',   val: (r) => r.rbi,  fmt: String, desc: true },
    { key: 'sb',   label: '盗塁',   val: (r) => r.sb,   fmt: String, desc: true },
    { key: 'obp',  label: '出塁率', val: (r) => r.obp,  fmt: fmtAvg, desc: true },
    { key: 'slg',  label: '長打率', val: (r) => r.slg,  fmt: fmtAvg, desc: true },
    { key: 'ops',  label: 'OPS',    val: (r) => r.ops,  fmt: (v) => v?.toFixed(3) ?? '—', desc: true },
  ];

  const PIT_CATS = [
    { key: 'era',  label: '防御率', val: (r) => r.era,  fmt: fmtEra, desc: false },
    { key: 'win',  label: '勝利',   val: (r) => r.win,  fmt: String, desc: true },
    { key: 'lose', label: '敗戦',   val: (r) => r.lose, fmt: String, desc: false },
    { key: 'so',   label: '奪三振', val: (r) => r.so,   fmt: String, desc: true },
    { key: 'ipOuts', label: '投球回', val: (r) => r.ipOuts, fmt: outsToIp, desc: true },
    { key: 'sv',   label: 'セーブ', val: (r) => r.sv,   fmt: String, desc: true },
  ];

  function makeRanking(data, cats) {
    const result = {};
    for (const cat of cats) {
      const sorted = [...data]
        .filter((r) => cat.val(r) != null)
        .sort((a, b) => {
          const va = cat.val(a) ?? -Infinity;
          const vb = cat.val(b) ?? -Infinity;
          return cat.desc ? vb - va : va - vb;
        });
      result[cat.key] = sorted.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        jersey_num: r.jersey_num,
        jersey_double_zero: r.jersey_double_zero,
        value: cat.val(r),
        display: cat.fmt(cat.val(r)),
      }));
    }
    return result;
  }

  return {
    bat: makeRanking(batData, BAT_CATS),
    pit: makeRanking(pitData, PIT_CATS),
    BAT_CATS,
    PIT_CATS,
  };
}

/** 背番号の表示形式 */
export function fmtJersey(num, doubleZero) {
  if (doubleZero) return '00';
  return String(num).padStart(1, '0');
}

/**
 * 過去の全年度の部門タイトル・MVP・エースを計算して返す。
 * 現在の年度（currentYear）は確定前なので対象外。
 *
 * 戻り値: { [playerName]: [{ year, label, golden, kind }] }
 */
export function buildAllAwards(players, allStats, games, currentYear) {
  const BAT_TITLE = {
    avg: '首位打者', hr: '本塁打王', rbi: '打点王',
    sb: '盗塁王',   hit: '最多安打',
  };
  const PIT_TITLE = {
    era: '防御率王', win: '最多勝', so: '奪三振王',
    ipOuts: '投球回王', sv: 'セーブ王',
  };

  const years = [
    ...new Set(games.map((g) => parseInt(g.date.slice(0, 4), 10))),
  ].filter((y) => y < currentYear).sort((a, b) => a - b);

  const awards = {};

  function addAward(name, year, label, golden = false, kind = '') {
    if (!awards[name]) awards[name] = [];
    if (!awards[name].some((a) => a.year === year && a.label === label)) {
      awards[name].push({ year, label, golden, kind });
    }
  }

  for (const year of years) {
    const yearGameIds = new Set(
      games.filter((g) => g.date.startsWith(String(year))).map((g) => g.id)
    );
    const yearStats = allStats.filter((s) => yearGameIds.has(s.game_id));
    const byPlayer = {};
    for (const s of yearStats) {
      if (!byPlayer[s.player_name]) byPlayer[s.player_name] = [];
      byPlayer[s.player_name].push(s);
    }

    const batData = [];
    const pitData = [];
    for (const p of players) {
      const rows = byPlayer[p.name] || [];
      if (rows.some((r) => r.ab > 0)) batData.push({ name: p.name, ...aggregateBatting(rows) });
      if (rows.some((r) => r.ip_outs > 0 || r.decision)) pitData.push({ name: p.name, ...aggregatePitching(rows) });
    }

    const batWinCount = {};
    const pitWinCount = {};

    // 打撃部門タイトル
    for (const [key, label] of Object.entries(BAT_TITLE)) {
      const sorted = [...batData]
        .filter((r) => r[key] != null && r[key] > 0)
        .sort((a, b) => b[key] - a[key]);
      if (sorted.length === 0) continue;
      const top = sorted[0][key];
      sorted.filter((r) => r[key] === top).forEach((r) => {
        addAward(r.name, year, `${year} ${label}`);
        batWinCount[r.name] = (batWinCount[r.name] || 0) + 1;
      });
    }

    // 投手部門タイトル
    for (const [key, label] of Object.entries(PIT_TITLE)) {
      const desc = key !== 'era';
      const sorted = [...pitData]
        .filter((r) => r[key] != null && r[key] > 0)
        .sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]);
      if (sorted.length === 0) continue;
      const top = sorted[0][key];
      sorted.filter((r) => r[key] === top).forEach((r) => {
        addAward(r.name, year, `${year} ${label}`);
        pitWinCount[r.name] = (pitWinCount[r.name] || 0) + 1;
      });
    }

    // MVP（最多打撃タイトル）
    const maxBat = Math.max(0, ...Object.values(batWinCount));
    if (maxBat > 0) {
      Object.entries(batWinCount)
        .filter(([, c]) => c === maxBat)
        .forEach(([name]) => addAward(name, year, `${year} MVP`, true, 'mvp'));
    }

    // エース（最多投手タイトル）
    const maxPit = Math.max(0, ...Object.values(pitWinCount));
    if (maxPit > 0) {
      Object.entries(pitWinCount)
        .filter(([, c]) => c === maxPit)
        .forEach(([name]) => addAward(name, year, `${year} エース`, true, 'ace'));
    }
  }

  // ソート: golden優先、同goldenは新しい年度順
  for (const name of Object.keys(awards)) {
    awards[name].sort((a, b) => {
      if (!!a.golden !== !!b.golden) return a.golden ? -1 : 1;
      return b.year - a.year || a.label.localeCompare(b.label);
    });
  }

  return awards;
}

/** チーム成績（指定年度）*/
export function buildTeamRecord(games, year) {
  const yearGames = games.filter((g) => g.date.startsWith(String(year)));
  const win = yearGames.filter((g) => g.result === 'win').length;
  const lose = yearGames.filter((g) => g.result === 'lose').length;
  const draw = yearGames.filter((g) => g.result === 'draw').length;
  const total = yearGames.length;
  const winPct = total ? (win / total).toFixed(3).replace(/^0/, '') : '—';
  return { win, lose, draw, total, winPct };
}
