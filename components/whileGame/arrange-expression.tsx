"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Player, PlayerNumber } from "@/lib/supabase"
import { ArrowUp, ArrowDown, Users, Crown } from "lucide-react"

interface ArrangeExpressionProps {
  currentPlayer: Player | null
  players: Player[]
  playerNumbers: PlayerNumber[]
  onBackToTitle: () => void
}

interface PlayerExpression {
  player: Player
  playerNumber: PlayerNumber
  currentPosition: number
}

export default function ArrangeExpression({
  currentPlayer,
  players,
  playerNumbers,
  onBackToTitle
}: ArrangeExpressionProps) {
  const [sortedPlayers, setSortedPlayers] = useState<PlayerExpression[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // プレイヤーと表現をマッピング
  useEffect(() => {
    const playerExpressions = players.map((player, index) => {
      const playerNumber = playerNumbers.find(pn => pn.player_id === player.id)
      return {
        player,
        playerNumber: playerNumber!,
        currentPosition: index
      }
    }).filter(pe => pe.playerNumber?.match_word) // 表現がある人だけ

    setSortedPlayers(playerExpressions)
  }, [players, playerNumbers])

  // プレイヤーの順番を変更
  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (!currentPlayer?.is_host) return

    const newSortedPlayers = [...sortedPlayers]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newSortedPlayers.length) {
      [newSortedPlayers[index], newSortedPlayers[targetIndex]] = 
      [newSortedPlayers[targetIndex], newSortedPlayers[index]]
      
      setSortedPlayers(newSortedPlayers)
    }
  }

  // 並び替え確定
  const submitOrder = async () => {
    if (!currentPlayer?.is_host || isSubmitting) return

    setIsSubmitting(true)
    try {
      // TODO: 並び替え結果をデータベースに保存
      console.log('並び替え結果:', sortedPlayers.map(sp => ({
        playerId: sp.player.id,
        name: sp.player.name,
        expression: sp.playerNumber.match_word,
        number: sp.playerNumber.number
    })));

      // 次のフェーズ（reveal）に移行
      // TODO: フェーズ更新機能を実装
      
    } catch (error) {
      console.error('並び替え送信エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-purple-600 text-center flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            表現を並び替える
          </CardTitle>
          <CardDescription className="text-center">
            {currentPlayer?.is_host 
              ? "数字の小さい順になるように並び替えてください"
              : "ホストが並び替えるのを待っています..."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* プレイヤー一覧 */}
      <Card className="shadow-2xl">
        <CardContent className="p-4">
          <div className="space-y-2">
            {sortedPlayers.map((playerExpression, index) => (
              <div
                key={playerExpression.player.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{playerExpression.player.name}</span>
                      {playerExpression.player.is_host && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      "{playerExpression.playerNumber.match_word}"
                    </span>
                  </div>
                </div>

                {/* ホストのみ並び替えボタンを表示 */}
                {currentPlayer?.is_host && (
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={() => movePlayer(index, 'up')}
                      disabled={index === 0}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => movePlayer(index, 'down')}
                      disabled={index === sortedPlayers.length - 1}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 mt-4">
            {currentPlayer?.is_host ? (
              <Button
                onClick={submitOrder}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? "送信中..." : "並び替え確定"}
              </Button>
            ) : (
              <div className="flex-1 bg-gray-100 p-3 rounded text-center text-gray-600">
                ホストが並び替えています...
              </div>
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
}