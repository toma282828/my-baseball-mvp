import Link from 'next/link';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';
import { fmtJersey } from '@/lib/stats';

export default async function PlayersPage() {
  const teamSlug = await getCurrentTeamSlug();
  const { players } = await getAppData(teamSlug);
  const sorted = [...players].sort((a, b) => {
    if (a.jersey_double_zero && !b.jersey_double_zero) return -1;
    if (!a.jersey_double_zero && b.jersey_double_zero) return 1;
    return a.jersey_num - b.jersey_num;
  });

  return (
    <div>
      <h2>選手一覧</h2>
      <p className="hint" style={{marginBottom:12}}>
        登録済みの全選手。名前をタップすると成績を確認できます。
      </p>
      {sorted.length === 0 ? (
        <p className="hint" style={{textAlign:'center',padding:'24px 0'}}>
          選手が登録されていません
        </p>
      ) : (
        <ul className="player-list">
          {sorted.map((p) => (
            <li key={p.id}>
              <Link href={`/players/${encodeURIComponent(p.name)}`}
                style={{display:'flex',alignItems:'center',width:'100%',textDecoration:'none',color:'inherit'}}>
                <span className="num">#{fmtJersey(p.jersey_num, p.jersey_double_zero)}</span>
                <span className="name">{p.name}</span>
                <span className="pos">{p.position}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
