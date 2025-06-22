"use client"

import { useState, useEffect } from "react"
import type { GameState } from "@/lib/supabase"
import { useGameStore } from "@/stores/gameStore"
import TitleScreen from "@/components/title-screen"
import CreateTeamScreen from "@/components/create-team-screen"
import JoinTeamScreen from "@/components/join-team-screen"
import WaitingScreen from "@/components/waiting-screen"
import GenreSelectScreen from "@/components/genre-select-screen"

export default function ItoGame() {
  const [gameState, setGameState] = useState<GameState>("title")
  const [playerName, setPlayerName] = useState("")
  const [joinTeamId, setJoinTeamId] = useState("")

  const {
    currentRoom,
    players,
    currentPlayer,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    unsubscribeFromRoom,
    isLoading,
    error,
  } = useGameStore()

  // チームを作成
  const createTeam = async () => {
    if (!playerName.trim()) return

    try {
      const roomCode = await createRoom(playerName)
      setGameState("create-team")
    } catch (err) {
      console.error("チーム作成エラー:", err)
    }
  }

  // チームに参加
  const joinTeam = async () => {
    if (!playerName.trim() || !joinTeamId.trim()) return

    try {
      const success = await joinRoom(joinTeamId, playerName)
      if (success) {
        setGameState("waiting")
      }
    } catch (err) {
      console.error("チーム参加エラー:", err)
    }
  }

  // ゲーム開始（ホストのみ）
  const handleStartGame = async () => {
    // ジャンル選択画面に遷移
    setGameState("genre-select")
  }

  // ジャンル選択後のゲーム開始
  const handleGenreSelect = async (genre: string) => {
    try {
      await startGame(genre)
      setGameState("playing")
    } catch (err) {
      console.error("ゲーム開始エラー:", err)
    }
  }

  // タイトル画面に戻る
  const backToTitle = () => {
    leaveRoom()
    setGameState("title")
    setPlayerName("")
    setJoinTeamId("")
  }

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      unsubscribeFromRoom()
    }
  }, [unsubscribeFromRoom])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="text-white text-xl">エラー: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {gameState === "title" && (
          <TitleScreen
            playerName={playerName}
            setPlayerName={setPlayerName}
            onCreateTeam={createTeam}
            onJoinTeam={() => setGameState("join-team")}
          />
        )}

        {gameState === "join-team" && (
          <JoinTeamScreen
            joinTeamId={joinTeamId}
            setJoinTeamId={setJoinTeamId}
            onJoinTeam={joinTeam}
            onBackToTitle={backToTitle}
          />
        )}

        {gameState === "create-team" && currentRoom && (
          <CreateTeamScreen
            teamId={currentRoom.room_code}
            players={players}
            onStartGame={handleStartGame}
            onBackToTitle={backToTitle}
          />
        )}

        {gameState === "waiting" && currentRoom && (
          <WaitingScreen
            teamId={currentRoom.room_code}
            players={players}
            onBackToTitle={backToTitle}
          />
        )}

        {gameState === "genre-select" && currentRoom && (
          <GenreSelectScreen
            onGenreSelect={handleGenreSelect}
            onBackToWaiting={() => setGameState("create-team")}
          />
        )}
      </div>
    </div>
  )
}
