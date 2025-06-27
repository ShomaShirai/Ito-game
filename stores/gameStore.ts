import { create } from "zustand";
import { supabase, Room, Player, Game, PlayerNumber, Topic } from '@/lib/supabase';

interface GameActions {
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: (selectedGenre: string) => Promise<void>;
  sendMatchWord: (matchWord: string) => Promise<void>;
  subscribeToPlayers: (roomId: string) => () => void;
  subscribeToGameStart: (roomId: string) => () => void;
  subscribeToGamePlay: (roomId: string) => () => void;
  unsubscribeFromRoom: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  checkAllPlayersSubmitted: () => void;
  updateGamePhase: (phase: string) => Promise<void>;
  savePlayerOrder: (arrangedPlayerIds: string[]) => Promise<void>;
  updatePlayerLife: (playerId: string, lifeChange: number) => Promise<void>;
  startNextGame: () => Promise<void>;
  generateUniqueNumbers: (count: number, min?: number, max?: number) => number[];
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

  // リアルタイム購読の参照を保持（チャンネル自体を保存）
  playersChannel: any;
  gameStartChannel: any;
  gamePlayChannel: any;
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
  playersChannel: null,
  gameStartChannel: null,
  gamePlayChannel: null,

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

      // プレイヤー参加の購読を開始
      get().subscribeToPlayers(updatedRoom.id);
      // ゲーム開始の購読を開始
      get().subscribeToGameStart(updatedRoom.id);

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

      // プレイヤー参加の購読を開始
      get().subscribeToPlayers(room.id);
      // ゲーム開始の購読を開始
      get().subscribeToGameStart(room.id);

      return true;
    } catch (error) {
      console.error("チーム参加の際にエラーが発生しました", error);
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  // 部屋を退出する関数
  leaveRoom: async () => {
    const { currentPlayer, playersChannel, gameStartChannel, gamePlayChannel } = get();
    
    // 全ての購読を停止
    get().unsubscribeFromRoom();
    
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

  // 重複しない数字を生成するヘルパー関数
  generateUniqueNumbers: (count: number, min: number = 1, max: number = 100): number[] => {
    if (count > (max - min + 1)) {
      throw new Error(`Cannot generate ${count} unique numbers between ${min} and ${max}`);
    }
    
    const numbers: number[] = [];
    const usedNumbers = new Set<number>();
    
    while (numbers.length < count) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!usedNumbers.has(randomNumber)) {
        usedNumbers.add(randomNumber);
        numbers.push(randomNumber);
      }
    }
    
    return numbers;
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

      // ゲームを作成
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: currentRoom.id,
          round_number: 1,
          topic_id: topic.id,
          topic_number: topic.number,
          phase: 'discuss',
          player_order: players.map(p => p.id)
        })
        .select()
        .single();
      if (gameError) throw gameError;

      // 各プレイヤーに重複しない1-100の数字を割り当て
      const uniqueNumbers = get().generateUniqueNumbers(players.length);
      const playerNumbersToInsert = players.map((player, index) => ({
        game_id: game.id,
        player_id: player.id,
        number: uniqueNumbers[index],
        position: null
      }));

      const { data: insertedPlayerNumbers, error: numbersError } = await supabase
        .from('player_numbers')
        .insert(playerNumbersToInsert)
        .select();
      if (numbersError) throw numbersError;

      // 状態を更新
      set({
        currentGame: game,
        currentTopic: topic,
        playerNumbers: insertedPlayerNumbers || [],
        isLoading: false,
      });

      // ゲーム中の購読を開始
      get().subscribeToGamePlay(currentRoom.id);

    } catch (error) {
      console.error("ゲーム開始エラー:", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  // プレイヤーが入力した数字に当てはまる数字を表現するための関数
  sendMatchWord: async (matchWord: string) => {
    const { currentPlayer, currentGame } = get();
    if (!currentPlayer || !currentGame) return;

    try {
      const { data, error } = await supabase
        .from('player_numbers')
        .update({ match_word: matchWord.trim() })
        .eq('player_id', currentPlayer.id)
        .eq('game_id', currentGame.id)
        .select()
        .single();
      
      if (error) {
        console.error("表現の送信に失敗：", error);
        throw error;
      }

      // ローカル状態も更新
      const { playerNumbers } = get();
      const updatedPlayerNumbers = playerNumbers.map(pn => 
        pn.player_id === currentPlayer.id 
          ? { ...pn, match_word: matchWord.trim() }
          : pn
      );
      set({ playerNumbers: updatedPlayerNumbers });

      console.log("表現の送信に成功しました:", data);

      // 全員が表現を送信したかチェック
      get().checkAllPlayersSubmitted();

    } catch (error) {
      console.error("表現の送信中にエラーが発生しました：", error);
      set({ error: "表現の送信に失敗しました" });
    }
  },

  // 全員が表現を送信したかチェックする関数
  checkAllPlayersSubmitted: async () => {
    const { players, playerNumbers, currentGame, currentPlayer } = get();
    if (!currentGame || !currentPlayer?.is_host) return;

    // discussフェーズ以外では実行しない
    if (currentGame.phase !== 'discuss') {
      console.log('discussフェーズ以外のため全員送信チェックをスキップ:', currentGame.phase);
      return;
    }

    // 全プレイヤーが表現を送信しているかチェック
    const allSubmitted = players.every(player => {
      const playerNumber = playerNumbers.find(pn => pn.player_id === player.id);
      return playerNumber?.match_word && playerNumber.match_word.trim() !== '';
    });

    console.log('全員送信チェック:', allSubmitted, 'プレイヤー数:', players.length);

    if (allSubmitted) {
      console.log('全員が表現を送信完了 - arrangeフェーズに移行');
      await get().updateGamePhase('arrange');
    }
  },

  // 並び替えた順番を保存して，revealフェーズに移行
  savePlayerOrder: async (arrangedPlayerIds: string[]) => {
    const { currentGame, currentPlayer } = get();
    if (!currentGame || !currentPlayer?.is_host) return;

    try {
      // 各プレイヤーのpositionを更新（Promise.allで並行処理）
      const updatePromises = arrangedPlayerIds.map((playerId, index) => 
        supabase
          .from('player_numbers')
          .update({ position: index + 1 }) // 1から始まる順位
          .eq('game_id', currentGame.id)
          .eq('player_id', playerId)
      );

      await Promise.all(updatePromises);
      console.log('プレイヤーの順番を保存しました:', arrangedPlayerIds);

      // revealフェーズに移行
      await get().updateGamePhase('reveal');
      
    } catch (error) {
      console.error('順番保存エラー:', error);
      set({ error: "順番の保存に失敗しました" });
      throw error;
    }
  },

  // ゲームフェーズを更新する関数
  updateGamePhase: async (phase: string) => {
    const { currentGame } = get();
    if (!currentGame) return;

    try {
      const { data: updatedGame, error: gameError } = await supabase
        .from('games')
        .update({ phase: phase })
        .eq('id', currentGame.id)
        .select()
        .single();

      if (gameError) {
        console.error("フェーズ更新に失敗しました", gameError);
        throw gameError;
      }

      set({ currentGame: updatedGame });
      console.log('フェーズを更新しました:', phase);
    } catch (error) {
      console.error("フェーズ更新エラー:", error);
      set({ error: "フェーズの更新に失敗しました" });
    }
  },

  // プレイヤーの点数を更新する関数
  updatePlayerLife: async (playerId: string, lifeChange: number) => {
    const { players } = get();
    
    try {
      // Optimistic Update（即座にフロントエンドを更新）
      const optimisticPlayers = players.map(p => 
        p.id === playerId 
          ? { ...p, total_life: p.total_life + lifeChange }
          : p
      );
      set({ players: optimisticPlayers });

      // データベースを更新
      const player = players.find(p => p.id === playerId);
      const newTotalLife = player ? player.total_life + lifeChange : lifeChange;
      const { data, error } = await supabase
        .from('players')
        .update({ total_life: newTotalLife })
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('点数更新エラー:', error);
        // エラー時は元に戻す
        set({ players });
        throw error;
      }

      console.log('点数更新成功:', data);
    } catch (error) {
      console.error('点数更新に失敗しました:', error);
      throw error;
    }
  },

  // 次のゲームを開始する関数
  startNextGame: async () => {
    const { currentRoom, currentPlayer, players, currentGame } = get();
    if (!currentRoom || !currentPlayer?.is_host || !currentGame) return;

    set({ isLoading: true, error: null });

    try {
      // 現在のラウンド数を取得して+1
      const nextRoundNumber = currentGame.round_number + 1;

      // ルームの現在のラウンドを更新
      await supabase
        .from('rooms')
        .update({ current_round: nextRoundNumber })
        .eq('id', currentRoom.id);

      // 前回と同じジャンルから新しいトピックを選択
      const { data: currentTopic } = await supabase
        .from('topics')
        .select()
        .eq('id', currentGame.topic_id)
        .single();

      if (!currentTopic) throw new Error('現在のトピックが見つかりません');

      // 同じカテゴリの他のトピックを取得
      const { data: availableTopics, error: topicsError } = await supabase
        .from('topics')
        .select()
        .eq('category', currentTopic.category)
        .neq('id', currentGame.topic_id); // 現在のトピックは除外

      if (topicsError) throw topicsError;
      if (!availableTopics || availableTopics.length === 0) {
        throw new Error('利用可能なトピックがありません');
      }

      // ランダムに新しいトピックを選択
      const randomIndex = Math.floor(Math.random() * availableTopics.length);
      const newTopic = availableTopics[randomIndex];

      // 新しいゲームを作成
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: currentRoom.id,
          round_number: nextRoundNumber,
          topic_id: newTopic.id,
          topic_number: newTopic.number,
          phase: 'discuss',
          player_order: players.map(p => p.id)
        })
        .select()
        .single();
      if (gameError) throw gameError;

      // 各プレイヤーに重複しない新しい数字を割り当て
      const uniqueNumbers = get().generateUniqueNumbers(players.length);
      const playerNumbersToInsert = players.map((player, index) => ({
        game_id: newGame.id,
        player_id: player.id,
        number: uniqueNumbers[index],
        position: null,
        match_word: null
      }));

      const { data: insertedPlayerNumbers, error: numbersError } = await supabase
        .from('player_numbers')
        .insert(playerNumbersToInsert)
        .select();
      if (numbersError) throw numbersError;

      // 状態を更新
      set({
        currentGame: newGame,
        currentTopic: newTopic,
        playerNumbers: insertedPlayerNumbers || [],
        isLoading: false,
      });

      console.log('次のゲームを開始しました:', newGame);
      
    } catch (error) {
      console.error("次のゲーム開始エラー:", error);
      set({ error: error instanceof Error ? error.message : '次のゲームの開始に失敗しました', isLoading: false });
      throw error;
    }
  },

  // 新しい人がチームに入ってきたタイミングでsubscribeする関数
  subscribeToPlayers: (roomId: string) => {
    const { playersChannel } = get();

    console.log('プレイヤー購読開始:', roomId);
    
    const channel = supabase
      .channel(`players-${roomId}-${Date.now()}`) // タイムスタンプで一意性を保証
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('プレイヤー変更:', payload);
          const { players } = get();
          
          if (payload.eventType === 'INSERT') {
            const newPlayer = payload.new as Player;
            if (!players.some(p => p.id === newPlayer.id)) {
              console.log('新しいプレイヤー追加:', newPlayer.name);
              set({ players: [...players, newPlayer] });
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('プレイヤー削除:', payload.old);
            set({ players: players.filter(p => p.id !== payload.old.id) });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPlayer = payload.new as Player;
            console.log('プレイヤー更新:', updatedPlayer.name);
            set({
              players: players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('プレイヤー購読状態:', status);
      });

    set({ playersChannel: channel });

    return () => {
      console.log('プレイヤー購読停止');
      supabase.removeChannel(channel);
    };
  },

  // ゲームを開始した際にホスト以外の画面も遷移できるようにする関数
  subscribeToGameStart: (roomId: string) => {
    const { gameStartChannel } = get();

    console.log('ゲーム開始購読開始:', roomId);
    
    const channel = supabase
      .channel(`game-start-${roomId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('ルーム状態更新:', payload);
          const updatedRoom = payload.new as Room;
          
          // ルーム状態を更新
          set({ currentRoom: updatedRoom });
          
          // ゲームが開始された場合、ゲーム情報を取得
          if (updatedRoom.status === 'playing') {
            console.log('ゲーム開始検出 - ゲーム情報取得開始');
            try {
              // 最新のゲーム情報を取得
              const { data: game, error: gameError } = await supabase
                .from('games')
                .select()
                .eq('room_id', roomId)
                .order('round_number', { ascending: false }) // 最新のラウンドを取得
                .single();
              
              if (!gameError && game) {
                console.log('ゲーム情報取得成功:', game);
                
                // トピック情報を取得
                const { data: topic, error: topicError } = await supabase
                  .from('topics')
                  .select()
                  .eq('id', game.topic_id)
                  .single();
                
                if (!topicError && topic) {
                  console.log('トピック情報取得成功:', topic);
                  
                  // プレイヤー数字情報を取得
                  const { data: playerNumbers, error: numbersError } = await supabase
                    .from('player_numbers')
                    .select()
                    .eq('game_id', game.id);
                  
                  if (!numbersError && playerNumbers) {
                    console.log('プレイヤー数字情報取得成功:', playerNumbers);

                    set({
                      currentGame: game,
                      currentTopic: topic,
                      playerNumbers: playerNumbers,
                    });

                    // ゲーム中の購読を開始
                    get().subscribeToGamePlay(roomId);
                  }
                }
              }
            } catch (error) {
              console.error('ゲーム情報取得エラー:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('新しいゲーム検出:', payload);
          const newGame = payload.new as Game;
          
          try {
            // トピック情報を取得
            const { data: topic, error: topicError } = await supabase
              .from('topics')
              .select()
              .eq('id', newGame.topic_id)
              .single();
            
            if (!topicError && topic) {
              console.log('新ゲームトピック情報取得成功:', topic);
              
              // プレイヤー数字情報を取得
              const { data: playerNumbers, error: numbersError } = await supabase
                .from('player_numbers')
                .select()
                .eq('game_id', newGame.id);
              
              if (!numbersError && playerNumbers) {
                console.log('新ゲームプレイヤー数字情報取得成功:', playerNumbers);

                set({
                  currentGame: newGame,
                  currentTopic: topic,
                  playerNumbers: playerNumbers,
                });

                // 新しいゲームIDで購読を再開
                get().subscribeToGamePlay(roomId);

                console.log('次のゲームに画面更新完了');
              }
            }
          } catch (error) {
            console.error('新ゲーム情報取得エラー:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('ゲーム開始購読状態:', status);
      });

    set({ gameStartChannel: channel });

    return () => {
      console.log('ゲーム開始購読停止');
      supabase.removeChannel(channel);
    };
  },

  // ゲーム中のリアルタイム購読を行う関数
  subscribeToGamePlay: (roomId: string) => {
    const { currentGame } = get();
    
    if (!currentGame) {
      console.log('currentGameが存在しないため購読をスキップ');
      return () => {};
    }
    
    console.log('ゲーム中購読開始:', roomId, 'ゲームID:', currentGame.id, 'フェーズ:', currentGame.phase);
    
    const channel = supabase
      .channel(`game-play-${roomId}-${currentGame.id}-${Date.now()}`) // ゲームIDも含めて一意性を保証
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedGame = payload.new as Game;
            const { currentGame: storeCurrentGame } = get();
            
            // 現在のゲームIDと一致する場合のみ更新
            if (storeCurrentGame && updatedGame.id === storeCurrentGame.id) {
              console.log('ゲーム状態更新:', {
                gameId: updatedGame.id,
                oldPhase: storeCurrentGame.phase,
                newPhase: updatedGame.phase
              });
              
              set({ currentGame: updatedGame });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_numbers',
          filter: `game_id=eq.${currentGame.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedPlayerNumber = payload.new as PlayerNumber;
            const { playerNumbers, currentPlayer, currentGame } = get();
            
            console.log('プレイヤー数字更新:', {
              gameId: currentGame?.id,
              playerId: updatedPlayerNumber.player_id,
              matchWord: updatedPlayerNumber.match_word,
              position: updatedPlayerNumber.position,
              currentPhase: currentGame?.phase
            });
            
            // ローカル状態を更新
            const updatedPlayerNumbers = playerNumbers.map(pn => 
              pn.id === updatedPlayerNumber.id ? updatedPlayerNumber : pn
            );
            set({ playerNumbers: updatedPlayerNumbers });

            // ホストかつdiscussフェーズの場合のみ全員送信チェック
            if (currentPlayer?.is_host && currentGame?.phase === 'discuss') {
              console.log('discussフェーズのため全員送信チェックを実行');
              setTimeout(() => {
                get().checkAllPlayersSubmitted();
              }, 1000);
            } else {
              console.log('全員送信チェックをスキップ:', {
                isHost: currentPlayer?.is_host,
                phase: currentGame?.phase
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('ゲーム中購読状態:', status, 'ゲームID:', currentGame.id);
      });

    set({ gamePlayChannel: channel });

    return () => {
      console.log('ゲーム中購読停止:', currentGame.id);
      supabase.removeChannel(channel);
    };
  },

  // 次のゲームが始まるときにホスト以外の画面も更新するための関数

  // 購読停止関数
  unsubscribeFromRoom: () => {
    const { playersChannel, gameStartChannel, gamePlayChannel } = get();
    
    if (playersChannel) {
      supabase.removeChannel(playersChannel);
      set({ playersChannel: null });
    }
    if (gameStartChannel) {
      supabase.removeChannel(gameStartChannel);
      set({ gameStartChannel: null });
    }
    if (gamePlayChannel) {
      supabase.removeChannel(gamePlayChannel);
      set({ gamePlayChannel: null });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));