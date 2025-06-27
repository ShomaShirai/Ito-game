import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// クライアントの定義
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ゲーム状態の型定義
export type GameState = "title" | "create-team" | "join-team" | "waiting" | "genre-select" | "playing";

// ゲームフェーズの型定義
export type GamePhase = "discuss" | "arrange" | "reveal" | "result";

// ジャンルの型定義
export type Genre = "恋愛" | "盛り上がる" | "エッチ";

// 以下はデータベースの型定義を行う
export interface Room {
  id: string;
  room_code: string;
  host_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  current_round: number;
  max_rounds: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  avatar_color: string;
  total_life: number;
  is_host: boolean;
  is_online: boolean;
  joined_at: string;
}

export interface Topic {
  id: string;
  number: number;
  title: string;
  description: string | null;
  category: string;
}

export interface Game {
  id: string;
  room_id: string;
  round_number: number;
  topic_id: string | null;
  topic_number: number | null;
  phase: 'discuss' | 'arrange' | 'reveal' | 'result';
  player_order: string[];
  started_at: string;
  ended_at: string | null;
}

export interface PlayerNumber {
  id: string;
  game_id: string;
  player_id: string;
  number: number;
  position: number | null;
  match_word: string | null;
}