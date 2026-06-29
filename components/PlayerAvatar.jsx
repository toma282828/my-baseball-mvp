'use client';

export default function PlayerAvatar({ name, avatarUrl, jerseyNum, jerseyDoubleZero, size = 32 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ''}
        className="player-avatar"
        style={style}
      />
    );
  }

  const label = name?.slice(0, 1) || (jerseyDoubleZero ? '0' : String(jerseyNum ?? '?').slice(0, 1));

  return (
    <span className="player-avatar player-avatar-fallback" style={style} aria-hidden>
      {label}
    </span>
  );
}