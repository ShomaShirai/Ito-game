"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Player, PlayerNumber } from "@/lib/supabase"
import { Eye, EyeOff, Crown, Zap, Heart } from "lucide-react"

interface RevealRealOrderProps {
  currentPlayer: Player | null
  players: Player[]
  playerNumbers: PlayerNumber[]
  onBackToTitle: () => void
  onUpdatePlayerLife?: (playerId: string, lifeChange: number) => Promise<void>
  onStartNextGame?: () => Promise<void>
}

interface PlayerOrderInfo {
  player: Player
  playerNumber: PlayerNumber
  position: number
  revealed: boolean
}

export default function RevealRealOrder({
  currentPlayer,
  players,
  playerNumbers,
  onBackToTitle,
  onUpdatePlayerLife,
  onStartNextGame
}: RevealRealOrderProps) {
  const [orderedPlayers, setOrderedPlayers] = useState<PlayerOrderInfo[]>([])
  const [scoreProcessed, setScoreProcessed] = useState(false)
  const [allAreRevealed, setAllAreRevealed] = useState(false)
  // const [isChangeLife, setIsChangeLife] = useState(false)

  // プレイヤーを並び替えた順番でソート
  useEffect(() => {
    const sortedPlayerInfo = players
      .map(player => {
        const playerNumber = playerNumbers.find(pn => pn.player_id === player.id)
        return {
          player,
          playerNumber: playerNumber!,
          position: playerNumber?.position || 999,
          revealed: false
        }
      })
      .filter(info => info.playerNumber?.position) // positionがあるもののみ
      .sort((a, b) => a.position - b.position)

    // 既存の表示状態を保持しながら更新
    setOrderedPlayers(prev => {
      if (prev.length === 0) {
        // 初回読み込み時はそのまま設定
        setScoreProcessed(false)
        setAllAreRevealed(false)
        return sortedPlayerInfo
      }
      
      // プレイヤー情報は更新するが、revealed状態は保持
      return sortedPlayerInfo.map(newPlayerInfo => {
        const existingPlayer = prev.find(p => p.player.id === newPlayerInfo.player.id)
        return {
          ...newPlayerInfo,
          revealed: existingPlayer ? existingPlayer.revealed : false
        }
      })
    })
    // setScoreProcessed(false) // 新しいデータが来たら点数処理をリセット
  }, [players, playerNumbers])
  
  useEffect(() => {
    if (allAreRevealed && !scoreProcessed && orderedPlayers.length > 0) {
      processScoreReduction()
      setScoreProcessed(true)
    }
  }, [allAreRevealed, scoreProcessed, orderedPlayers])

  // 1つずつ数字を表示
  const revealNext = () => {
    setOrderedPlayers(prev => {
      const nextIndex = prev.findIndex(p => !p.revealed)
      if (nextIndex === -1) return prev

      const updated = [...prev]
      updated[nextIndex] = { ...updated[nextIndex], revealed: true }

      // 次の数字が全て表示されたかチェック
      const allRevealed = updated.every(p => p.revealed)
      if (allRevealed) setAllAreRevealed(true)
      
      return updated
    })
  }

  // 一気に全て表示
  const revealAll = () => {
    setOrderedPlayers(prev => prev.map(p => ({ ...p, revealed: true })))
    setAllAreRevealed(true)
  }

  // 点数減算処理
  const processScoreReduction = async () => {
    if (!orderedPlayers.length || !onUpdatePlayerLife) return

    const worstPlayers = findWorstPlayers()
    if (worstPlayers.length > 0) {
      try {
        // 複数のプレイヤーの点数を同時に減算
        await Promise.all(
          worstPlayers.map(player => 
            onUpdatePlayerLife(player.player.id, -1)
          )
        )
        console.log(`${worstPlayers.map(p => p.player.name).join(', ')}の点数を-1しました`)
      } catch (error) {
        console.error('点数更新エラー:', error)
      }
    }
  }

  // 最も順番が離れているプレイヤーたちを見つける（複数対応）
  const findWorstPlayers = (): PlayerOrderInfo[] => {
    if (orderedPlayers.length === 0) return []

    // 正しい順番（数字の昇順）
    const correctOrder = [...orderedPlayers].sort((a, b) => a.playerNumber.number - b.playerNumber.number)
    
    let maxDistance = 0
    const playerDistances: { player: PlayerOrderInfo; distance: number }[] = []

    // 各プレイヤーの距離を計算
    orderedPlayers.forEach((playerInfo, arrangedIndex) => {
      const correctIndex = correctOrder.findIndex(p => p.player.id === playerInfo.player.id)
      const distance = Math.abs(arrangedIndex - correctIndex)
      
      playerDistances.push({ player: playerInfo, distance })
      
      if (distance > maxDistance) {
        maxDistance = distance
      }
    })

    // 最大距離のプレイヤーたちを返す
    return playerDistances
      .filter(item => item.distance === maxDistance)
      .map(item => item.player)
  }

  const goNextGame = async () => {
    if (!onStartNextGame) {
      console.error('onStartNextGame関数が提供されていません');
      return;
    }

    try {
      console.log("次のゲームに進みます");
      await onStartNextGame();
    } catch (error) {
      console.error('次のゲーム開始エラー:', error);
    }
  }

  const goFinalResult = () => {
    // 最終結果画面に進む処理を実装
    console.log("最終結果画面に進みます")
  }

  const nextRevealIndex = orderedPlayers.findIndex(p => !p.revealed)
  const worstPlayers = allAreRevealed ? findWorstPlayers() : []

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-purple-600 text-center flex items-center justify-center gap-2">
            <Eye className="h-5 w-5" />
            数字の発表
          </CardTitle>
          <CardDescription className="text-center">
            昇順に並び替えた番号で，実際の数字を確認しましょう
          </CardDescription>
        </CardHeader>
      </Card>

      {/* プレイヤー一覧 */}
      <Card className="shadow-2xl">
        <CardContent className="p-4">
          <div className="space-y-2">
            {orderedPlayers.map((playerInfo, index) => (
              <div
                key={playerInfo.player.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                  playerInfo.revealed 
                    ? 'bg-green-50 border-green-200' 
                    : nextRevealIndex === index 
                      ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-300' 
                      : 'bg-white border-gray-200'
                } ${
                  allAreRevealed && worstPlayers.some(wp => wp.player.id === playerInfo.player.id)
                    ? 'ring-2 ring-red-300 bg-red-50'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{playerInfo.player.name}</span>
                      {playerInfo.player.is_host && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                      {/* 点数表示 */}
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          {playerInfo.player.total_life}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      "{playerInfo.playerNumber.match_word}"
                    </span>
                    {/* 最も外れていた場合の表示 */}
                    {allAreRevealed && worstPlayers.some(wp => wp.player.id === playerInfo.player.id) && (
                      <span className="text-xs text-red-600 font-medium">
                        最も順番が離れていました (-1点)
                      </span>
                    )}
                  </div>
                </div>

                {/* 数字表示エリア */}
                <div className="flex items-center gap-2">
                  {playerInfo.revealed ? (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-xl">
                      {playerInfo.playerNumber.number}
                    </div>
                  ) : (
                    <div className="bg-gray-200 px-4 py-2 rounded-lg text-gray-400 font-bold text-xl">
                      ?
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 成功/失敗の表示 */}
          {allAreRevealed && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="text-center">
                {isOrderCorrect() ? (
                  <div className="text-green-600">
                    <div className="text-2xl font-bold mb-2">🎉 成功！</div>
                    <p>正しい順番で並び替えることができました！</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="text-2xl font-bold mb-2">❌ 失敗</div>
                    <p>順番が違っていました！</p>
                    {worstPlayers.length > 0 && (
                      <p className="text-sm mt-2">
                        {worstPlayers.length === 1 ? (
                          `${worstPlayers[0].player.name}さんが最も順番から離れていたため、1点減少します。`
                        ) : (
                          `${worstPlayers.map(wp => wp.player.name).join('、')}さんが最も順番から離れていたため、それぞれ1点減少します。`
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2 mt-4">
            {!allAreRevealed && nextRevealIndex !== -1 && (
              <Button
                onClick={revealNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                次を表示 ({nextRevealIndex + 1}/{orderedPlayers.length})
              </Button>
            )}
            
            {!allAreRevealed && (
              <Button
                onClick={revealAll}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                一気に見る
              </Button>
            )}

            {allAreRevealed && currentPlayer?.is_host && (
              <Button
                onClick={goNextGame}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
              >
                次のゲームに進む
              </Button>
            )}

            {allAreRevealed && currentPlayer?.is_host && (
              <Button
                onClick={goFinalResult}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                ゲームを終了する
              </Button>
            )}

            {allAreRevealed && !currentPlayer?.is_host && (
              <div className="flex-1 bg-gray-100 p-3 rounded text-center text-gray-600">
                お待ちください...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 順番が正しいかチェック
  function isOrderCorrect(): boolean {
    const sortedByNumber = [...orderedPlayers].sort((a, b) => a.playerNumber.number - b.playerNumber.number)
    return orderedPlayers.every((player, index) => 
      player.playerNumber.number === sortedByNumber[index].playerNumber.number
    )
  }
}