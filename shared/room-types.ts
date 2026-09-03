export type GameMode = 'friends' | 'guess';
export type QuestionSource = 'preset' | 'custom';
export type RoomPhase = 'lobby' | 'question_draft' | 'countdown' | 'ranking' | 'waiting' | 'reveal' | 'finished';

export type Player = { id: string; name: string; avatar: string; joinedAt: number; ready: boolean; connected: boolean };
export type Settings = { questionCount: 2 | 3 | 4; rounds: 1 | 2 | 3; mode: GameMode; questionSource: QuestionSource };
export type Room = { code: string; hostId: string; phase: RoomPhase; players: Player[]; settings: Settings; customQuestions: Record<string, string[]>; updatedAt: number; countdownEndsAt?: number; revealIndex?: number };
export type RankingSubmission = { playerId: string; order: string[] };
export type RankingResult = { playerId: string; points: number; percent: number; firstPlaceVotes: number };
export type RoomState = Omit<Room, 'customQuestions'> & { questionProgress: number; questionTarget: number; results?: RankingResult[] };
export type ClientEvent =
  | { type: 'settings_updated'; settings: Settings }
  | { type: 'ready_updated'; ready: boolean }
  | { type: 'questions_submitted'; questions: string[] }
  | { type: 'start_game' }
  | { type: 'cancel_countdown' }
  | { type: 'reveal_next' }
  | { type: 'ranking_submitted'; order: string[] };
export type ServerEvent = { type: 'room_state'; room: RoomState } | { type: 'error'; message: string };
