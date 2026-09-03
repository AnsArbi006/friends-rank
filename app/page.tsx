'use client';

import { useState } from 'react';
import { Crown, Music2, Send, Share2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { calculateBordaResults, friendQuestions, rankingCategories, type Player } from '@/lib/game';

const avatars = ['😎', '🐸', '🦊', '👽', '🐙', '🐧', '🦄', '🧃'];
const demoPlayers: Player[] = [
  { id: 'you', name: 'Du', avatar: '😎', score: 0 },
  { id: 'ali', name: 'Ali', avatar: '🐸', score: 0 },
  { id: 'mika', name: 'Mika', avatar: '🦊', score: 0 },
  { id: 'sam', name: 'Sam', avatar: '👽', score: 0 },
];
type Screen = 'home' | 'identity' | 'lobby' | 'ranking' | 'waiting' | 'reveal' | 'final';

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [name, setName] = useState('Nina');
  const [avatar, setAvatar] = useState('😎');
  const [mode, setMode] = useState<'friends' | 'guess'>('friends');
  const [rounds, setRounds] = useState(3);
  const [timer, setTimer] = useState(45);
  const [sound, setSound] = useState(true);
  const [order, setOrder] = useState(demoPlayers.map((player) => player.id));
  const [revealCount, setRevealCount] = useState(0);
  const players = demoPlayers.map((player) => player.id === 'you' ? { ...player, name, avatar } : player);
  const question = friendQuestions[0];
  const results = calculateBordaResults(players, [order, ['mika', 'ali', 'sam', 'you'], ['ali', 'you', 'mika', 'sam'], ['sam', 'mika', 'ali', 'you']], true);
  const startGame = () => { setOrder(players.map((player) => player.id)); setRevealCount(0); setScreen('ranking'); };

  return <main className="game-shell">
    <div className="orb orb-one" /><div className="orb orb-two" />
    <header className="topbar">
      <button className="brand" onClick={() => setScreen('home')} aria-label="Friends Rank Startseite"><span className="brand-mark"><Crown size={20} fill="currentColor" /></span><span>FRIENDS<br />RANK</span></button>
      {screen !== 'home' && <span className="room-code">RAUM <b>F7K2Q</b></span>}
      <button className="icon-button" onClick={() => setSound(!sound)} aria-label="Sound umschalten">{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
    </header>

    {screen === 'home' && <section className="home-screen screen-enter"><div className="hero-copy"><p className="kicker"><Sparkles size={16} /> DAS PARTY-GAME FÜR DEINE CREW</p><h1>WAS DENKEN<br />DEINE FREUNDE<br /><span>WIRKLICH?</span></h1><p className="lede">Rankt euch gegenseitig. Diskutiert die Ergebnisse. Bereut nichts.</p><div className="hero-actions"><button className="button button-primary" onClick={() => setScreen('identity')}>SPIEL ERSTELLEN <span>→</span></button><button className="button button-secondary" onClick={() => setScreen('identity')}>CODE EINGEBEN</button></div><p className="microcopy">Kein Account. Kein Download. Nur eure Gruppe.</p></div><div className="hero-stack" aria-hidden="true"><div className="sticker sticker-crown">👑</div><article className="floating-card card-ali"><span>🐸</span><strong>ALI</strong><small>Most chaotic</small></article><article className="floating-card card-mika"><span>🦊</span><strong>MIKA</strong><small>Would survive</small></article><article className="floating-card card-you"><span>😎</span><strong>DU?</strong><small>Find out</small></article><div className="burst">?!</div></div></section>}

    {screen === 'identity' && <section className="setup-screen panel screen-enter"><p className="eyebrow">SCHRITT 1 VON 2</p><h2>WER BIST DU HEUTE?</h2><label className="field-label" htmlFor="nickname">DEIN NAME</label><input id="nickname" className="name-input" value={name} onChange={(event) => setName(event.target.value.slice(0, 16))} maxLength={16} /><p className="field-label">SUCH DIR EINEN AVATAR AUS</p><div className="avatar-picker">{avatars.map((item) => <button key={item} className={avatar === item ? 'avatar-choice active' : 'avatar-choice'} onClick={() => setAvatar(item)}>{item}</button>)}</div><button className="button button-primary full" onClick={() => setScreen('lobby')}>WEITER ZUR LOBBY <span>→</span></button></section>}

    {screen === 'lobby' && <section className="lobby-screen screen-enter"><div className="lobby-heading"><p className="eyebrow">PRIVATE LOBBY</p><h2>DIE CREW IST FAST KOMPLETT.</h2><p>Schick den Code an deine Freund:innen und leg los.</p></div><div className="lobby-grid"><article className="invite-card"><p>DEIN RAUMCODE</p><strong>F7K2Q</strong><button className="copy-link"><Share2 size={16} /> EINLADUNG KOPIEREN</button></article><article className="settings-card"><div className="setting-row"><span>SPIELMODUS</span><div className="segmented"><button className={mode === 'friends' ? 'selected' : ''} onClick={() => setMode('friends')}>FRIENDS</button><button className={mode === 'guess' ? 'selected' : ''} onClick={() => setMode('guess')}>GUESS</button></div></div><div className="setting-row"><span>RUNDEN</span><div className="stepper"><button onClick={() => setRounds(Math.max(1, rounds - 1))}>−</button><b>{rounds}</b><button onClick={() => setRounds(Math.min(5, rounds + 1))}>+</button></div></div><div className="setting-row"><span>TIMER</span><div className="segmented">{[30, 45, 60].map((value) => <button key={value} className={timer === value ? 'selected' : ''} onClick={() => setTimer(value)}>{value}s</button>)}</div></div></article></div><div className="player-grid">{players.map((player, index) => <article className={index === 0 ? 'player-card host' : 'player-card'} key={player.id}><span>{player.avatar}</span><strong>{player.name}</strong>{index === 0 && <small>HOST</small>}</article>)}<article className="player-card empty"><span>+</span><strong>WIRD EINGELADEN</strong></article></div><div className="lobby-footer"><span><i /> 4 VON 4 BEREIT</span><button className="button button-primary" onClick={startGame}>RUNDE STARTEN <span>→</span></button></div></section>}

    {screen === 'ranking' && <section className="rank-screen screen-enter"><div className="round-top"><span>RUNDE 1 / {rounds}</span><span className="timer-pill">{timer}s</span></div><p className="eyebrow">RANKE DEINE FREUNDE</p><h2>{mode === 'friends' ? question.text : rankingCategories[0].title}</h2><p className="rank-help">Zieh die Person nach oben, die am ehesten zutrifft. Deine Antwort bleibt geheim.</p><div className="ranking-list">{order.map((id, index) => { const player = players.find((entry) => entry.id === id)!; return <article className="rank-card" key={id}><span className="place">{index + 1}</span><span className="rank-avatar">{player.avatar}</span><strong>{player.name}</strong><div className="rank-controls"><button disabled={index === 0} onClick={() => setOrder(move(order, index, index - 1))}>↑</button><button disabled={index === order.length - 1} onClick={() => setOrder(move(order, index, index + 1))}>↓</button></div></article>; })}</div><button className="button button-primary full" onClick={() => setScreen('waiting')}>RANKING ABGEBEN <Send size={17} /></button></section>}

    {screen === 'waiting' && <section className="waiting-screen panel screen-enter"><div className="done-mark">✓</div><p className="eyebrow">FERTIG!</p><h2>DEIN RANKING IST SICHER.</h2><p>3 von 4 Freund:innen sind schon fertig. Gleich wird es persönlich.</p><div className="reaction-row"><span>😂</span><span>👀</span><span>💀</span><span>🤡</span></div><button className="button button-secondary" onClick={() => setScreen('reveal')}>DEMO: REVEAL STARTEN</button></section>}

    {screen === 'reveal' && <section className="reveal-screen screen-enter"><p className="eyebrow">DIE GRUPPE HAT ENTSCHIEDEN</p><h2>{question.text}</h2><p className="reveal-note">Die Plätze kommen von hinten. Macht es nicht kaputt.</p><div className="result-list">{[...results].reverse().map((result, index) => { const shown = index < revealCount; const originalPlace = results.length - index; return <article className={shown ? `result-row show place-${originalPlace}` : 'result-row hidden'} key={result.player.id}><span className="result-place">{originalPlace}</span><span className="result-avatar">{result.player.avatar}</span><strong>{result.player.name}</strong><b>{result.percent}%</b></article>; })}</div>{revealCount < results.length ? <button className="button button-primary" onClick={() => setRevealCount(revealCount + 1)}>NÄCHSTER PLATZ <span>→</span></button> : <button className="button button-primary" onClick={() => setScreen('final')}>ERGEBNISSE ANZEIGEN <span>→</span></button>}</section>}

    {screen === 'final' && <section className="final-screen panel screen-enter"><div className="confetti">✦ ✦ ✦ ✦ ✦</div><p className="eyebrow">RUNDE 1 ERLEDIGT</p><h2>DAS WAR<br /><span>CHAOTISCH.</span></h2><div className="winner-card"><div>👑</div><span>AM EHESTEN</span><strong>{results[0].player.name.toUpperCase()}</strong><b>{results[0].percent}% Zustimmung</b></div><p>Die Gruppe kennt keine Gnade. Noch eine Runde?</p><button className="button button-primary" onClick={startGame}>NÄCHSTE RUNDE <span>→</span></button><button className="button button-ghost" onClick={() => setScreen('lobby')}>ZUR LOBBY</button><div className="sound-note"><Music2 size={15} /> Soundeffekte: {sound ? 'an' : 'aus'}</div></section>}
  </main>;
}
