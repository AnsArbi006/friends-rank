export type GameMode = 'friends' | 'guess' | 'guessFriend';
export type QuestionSource = 'preset' | 'custom';
export type RoomPhase = 'lobby' | 'question_draft' | 'countdown' | 'ranking' | 'waiting' | 'reveal' | 'finished' | 'clue_writing' | 'guessing' | 'guess_reveal';

export type Player = { id: string; name: string; avatar: string; joinedAt: number; ready: boolean; connected: boolean; isBot?: boolean };
export type Settings = { questionCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; customQuestionsPerPlayer: 1 | 2 | 3 | 4 | 5; mode: GameMode; questionSource: QuestionSource };
export type GuessQuestion = { authorId: string; targetId: string; text: string };
export type Room = { code: string; hostId: string; phase: RoomPhase; players: Player[]; settings: Settings; customQuestions: Record<string, string[]>; questions: string[]; roundResults: RankingResult[][]; cumulativeScores: Record<string, number>; guessQuestions: GuessQuestion[]; guessQuestionIndex: number; guessAuthorOrder: string[]; guessAuthorId?: string | null; guessAnswers: Record<string, { targetId: string; submittedAt: number }>; guessRoundScores: Record<string, number>; guessCumulativeScores: Record<string, number>; guessStartedAt?: number; guessDeadline?: number; updatedAt: number; countdownEndsAt?: number; revealIndex?: number; questionIndex?: number };
export type RankingSubmission = { playerId: string; order: string[] };
export type RankingResult = { playerId: string; points: number; totalPoints: number; percent: number; firstPlaceVotes: number };
export type RoomState = Omit<Room, 'customQuestions' | 'guessQuestions' | 'guessAuthorOrder' | 'guessAuthorId' | 'guessAnswers' | 'guessRoundScores' | 'guessCumulativeScores' | 'guessStartedAt'> & { questionProgress: number; questionTarget: number; totalQuestions: number; results?: RankingResult[]; guessRole?: 'author' | 'detective'; guessQuestionText?: string; guessOptions?: string[]; guessDeadline?: number; guessReveal?: { authorId: string; targetId: string; text: string; scores: Record<string, number> } };
export type ClientEvent =
  | { type: 'settings_updated'; settings: Settings }
  | { type: 'ready_updated'; ready: boolean }
  | { type: 'questions_submitted'; questions: string[] }
  | { type: 'start_game' }
  | { type: 'add_bot' }
  | { type: 'cancel_countdown' }
  | { type: 'reveal_next' }
  | { type: 'next_question' }
  | { type: 'guess_question_submitted'; text: string; targetId: string }
  | { type: 'guess_answer_submitted'; targetId: string }
  | { type: 'guess_reveal' }
  | { type: 'ranking_submitted'; order: string[] };
export type ServerEvent = { type: 'room_state'; room: RoomState } | { type: 'error'; message: string };
