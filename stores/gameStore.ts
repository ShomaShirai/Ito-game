import { create } from "zustand";
import { supabase, Room, Player, Game, PlayerNumber, Topic } from '@/lib/supabase';
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";

interface GameActions {
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: (selectedGenre: string) => Promise<void>;
  subscribeToRoom: (roomId: string) => () => void;
  unsubscribeFromRoom: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

interface GameState {
  // Room state
  currentRoom: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  
  // Game state
  currentGame: Game | null;
  currentTopic: Topic | null;
  playerNumbers: PlayerNumber[];
  playerOrder: string[];
  
  // UI state
  isLoading: boolean;
  error: string | null;

  // リアルタイム購読の参照を保持
  subscription: any;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  // 初期設定を定義する
  currentRoom: null,
  players: [],
  currentPlayer: null,
  currentGame: null,
  currentTopic: null,
  playerNumbers: [],
  playerOrder: [],
  isLoading: false,
  error: null,
  subscription: null,

  // 部屋を作成する関数
  createRoom: async (playerName: string) => {
    set({ isLoading: true, error: null });

    try {
      // 部屋の設定を行う
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({ room_code: roomCode })
        .select()
        .single();
      if (roomError) throw roomError;

      // プレイヤーの設定を行う
      const avatarColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
      const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName,
          avatar_color: avatarColor,
          is_host: true,
        })
        .select()
        .single();
      if (playerError) throw playerError;

      // プレイヤーの情報が取得できたから，そのあとにroomsテーブルを更新する
      const { data: updatedRoom, error: updateError } = await supabase
        .from('rooms')
        .update({ host_id: player.id })
        .eq('id', room.id)
        .select()
        .single();
      if (updateError) throw updateError;

      // 現在の状態を更新
      set({
        currentRoom: updatedRoom,
        players: [player],
        currentPlayer: player,
        isLoading: false,
      });

      // リアルタイム購読を開始
      const unsubscribe = get().subscribeToRoom(updatedRoom.id);
      set({ subscription: unsubscribe });

      return roomCode;
    } catch (error) {
      console.error("チーム作成の際に，エラーが発生しました．", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  // 部屋に参加する関数
  joinRoom: async (roomCode: string, playerName: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // 部屋の情報を取得
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select()
        .eq('room_code', roomCode.toUpperCase())
        .single();
      if (roomError || !room) throw new Error("ルームが見つかりません");
      if (room.status !== 'waiting') throw new Error("このルームは既にゲーム中です");

      // 既存のプレイヤー情報を取得
      const { data: existingPlayers, error: playersError } = await supabase
        .from('players')
        .select()
        .eq('room_id', room.id);
      if (playersError) throw playersError;

      // プレイヤーの名前がかぶっていないか確認
      if (existingPlayers?.some(p => p.name === playerName)) {
        set({ error: "この名前は既に利用されています。別の名前を選んでください。", isLoading: false });
        return false;
      }

      // 新しいプレイヤーを作成
      const avatarColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
      const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName,
          avatar_color: avatarColor,
          is_host: false,
        })
        .select()
        .single();
      if (playerError) throw playerError;

      // 状態を更新（既存プレイヤー + 新プレイヤー）
      set({
        currentRoom: room,
        players: [...(existingPlayers || []), player],
        currentPlayer: player,
        isLoading: false,
      });

      // リアルタイム購読を開始
      const unsubscribe = get().subscribeToRoom(room.id);
      set({ subscription: unsubscribe });

      return true;
    } catch (error) {
      console.error("チーム参加の際にエラーが発生しました", error);
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  // 部屋を退出する関数
  leaveRoom: async () => {
    const { currentPlayer, subscription } = get();
    
    // リアルタイム購読を停止
    if (subscription) {
      subscription();
      set({ subscription: null });
    }
    
    if (currentPlayer) {
      try {
        await supabase
          .from('players')
          .delete()
          .eq('id', currentPlayer.id);
        
        set({
          currentRoom: null,
          currentPlayer: null,
          players: [],
          currentGame: null,
          currentTopic: null,
          playerNumbers: [],
          playerOrder: [],
        });
      } catch (error) {
        console.error("退室エラー:", error);
      }
    }
  },

  // ゲームを開始する際の関数
  startGame: async (selectedGenre: string) => {
    const { currentRoom, currentPlayer, players } = get();
    if (!currentRoom || !currentPlayer?.is_host) return;

    set({ isLoading: true, error: null });

    try {
      // ルームのステータスを更新
      await supabase
        .from('rooms')
        .update({ status: 'playing', current_round: 1 })
        .eq('id', currentRoom.id);
      console.log("ルームのステータスを更新しました:", currentRoom.id);

      // ジャンルに応じたトピック番号の範囲を決定
      let topicRange = { min: 1, max: 5 };
      if (selectedGenre === '恋愛') {
        topicRange = { min: 1, max: 5 };
      } else if (selectedGenre === '盛り上がる') {
        topicRange = { min: 21, max: 25 };
      } else if (selectedGenre === 'エッチ') {
        topicRange = { min: 41, max: 45 };
      }

      // ランダムなトピックを選択
      const randomTopicNumber = Math.floor(Math.random() * (topicRange.max - topicRange.min + 1)) + topicRange.min;
      
      // トピック情報を取得
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select()
        .eq('number', randomTopicNumber)
        .single();
      if (topicError) throw topicError;
      console.log("選択されたトピック:", topic);

      // ゲームを作成
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: currentRoom.id,
          round_number: 1,
          topic_id: topic.id,
          topic_number: topic.number,
          phase: 'discuss',
          player_order: players.map(p => p.id),
          correct_order: []
        })
        .select()
        .single();
      if (gameError) throw gameError;
      console.log("ゲームの作成が完了しました:", game);

      // 各プレイヤーに1-100の数字を割り当て
      const playerNumbersToInsert = players.map(player => ({
        game_id: game.id,
        player_id: player.id,
        number: Math.floor(Math.random() * 100) + 1,
        position: null
      }));
      console.log("プレイヤーの数字を生成:", playerNumbersToInsert);

      const { data: insertedPlayerNumbers, error: numbersError } = await supabase
        .from('player_numbers')
        .insert(playerNumbersToInsert)
        .select();
      if (numbersError) throw numbersError;
      console.log("プレイヤーの数字が挿入されました:", insertedPlayerNumbers);

      // 状態を更新
      set({
        currentGame: game,
        currentTopic: topic,
        playerNumbers: insertedPlayerNumbers || [],
        isLoading: false,
      });

    } catch (error) {
      console.error("ゲーム開始エラー:", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  // リアルタイム購読を開始する関数
  subscribeToRoom: (roomId: string) => {
    // 既存の購読があれば停止
    const { subscription } = get();
    if (subscription) {
      subscription();
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { players } = get();
          
          if (payload.eventType === 'INSERT') {
            const newPlayer = payload.new as Player;
            // 重複チェック
            if (!players.some(p => p.id === newPlayer.id)) {
              set({ players: [...players, newPlayer] });
            }
          } else if (payload.eventType === 'DELETE') {
            set({ players: players.filter(p => p.id !== payload.old.id) });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPlayer = payload.new as Player;
            set({
              players: players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
            });
          }
        }
      )
      .subscribe();

    // クリーンアップ関数を返す
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 購読停止関数
  unsubscribeFromRoom: () => {
    const { subscription } = get();
    if (subscription) {
      subscription();
      set({ subscription: null });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));