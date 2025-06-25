"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Player, PlayerNumber } from "@/lib/supabase"
import { Eye, EyeOff, Crown, Zap } from "lucide-react"

interface RevealRealOrderProps {
  currentPlayer: Player | null
  players: Player[]
  playerNumbers: PlayerNumber[]
  onBackToTitle: () => void
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
  onBackToTitle
}: RevealRealOrderProps) {
  const [orderedPlayers, setOrderedPlayers] = useState<PlayerOrderInfo[]>([])
  const [allRevealed, setAllRevealed] = useState(false)

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

    setOrderedPlayers(sortedPlayerInfo)
  }, [players, playerNumbers])

  // 1つずつ数字を表示
  const revealNext = () => {
    setOrderedPlayers(prev => {
      const nextIndex = prev.findIndex(p => !p.revealed)
      if (nextIndex === -1) return prev

      const updated = [...prev]
      updated[nextIndex] = { ...updated[nextIndex], revealed: true }
      return updated
    })
  }

  // 一気に全て表示
  const revealAll = () => {
    setOrderedPlayers(prev => prev.map(p => ({ ...p, revealed: true })))
    setAllRevealed(true)
  }

  // 隠す
  const hideAll = () => {
    setOrderedPlayers(prev => prev.map(p => ({ ...p, revealed: false })))
    setAllRevealed(false)
  }

  const nextRevealIndex = orderedPlayers.findIndex(p => !p.revealed)
  const allAreRevealed = orderedPlayers.length > 0 && orderedPlayers.every(p => p.revealed)

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
            並び替えた順番で実際の数字を確認しましょう
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
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      順位: {playerInfo.position}
                    </Badge>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{playerInfo.player.name}</span>
                      {playerInfo.player.is_host && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      "{playerInfo.playerNumber.match_word}"
                    </span>
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
                    <p>順番が違っていました。次回頑張りましょう！</p>
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
            
            {!allRevealed && (
              <Button
                onClick={revealAll}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                一気に見る
              </Button>
            )}

            {allAreRevealed && (
              <Button
                onClick={hideAll}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                隠す
              </Button>
            )}

            <Button
              onClick={onBackToTitle}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              退出
            </Button>
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