"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Player } from "@/lib/supabase"
import { Trophy, Crown, Heart, Home } from "lucide-react"

interface ShowResultProps {
  currentPlayer: Player | null
  players: Player[]
  onBackToTitle: () => void
}

export default function ShowResult({
  currentPlayer,
  players,
  onBackToTitle
}: ShowResultProps) {
  // ライフが少ない順にソート
  const sortedPlayers = [...players].sort((a, b) => a.total_life - b.total_life)
  
  // 最もライフが少ないプレイヤーたち（同率最下位を考慮）
  const worstLife = sortedPlayers[0]?.total_life
  const worstPlayers = sortedPlayers.filter(p => p.total_life === worstLife)
  
  // 最もライフが多いプレイヤーたち（同率1位を考慮）
  const bestLife = sortedPlayers[sortedPlayers.length - 1]?.total_life
  const bestPlayers = sortedPlayers.filter(p => p.total_life === bestLife)

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇"
      case 1:
        return "🥈"
      case 2:
        return "🥉"
      default:
        return `${index + 1}位`
    }
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-purple-600 text-center flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            ゲーム結果
          </CardTitle>
          <CardDescription className="text-center">
            お疲れ様でした！最終結果を発表します
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 全体ランキング */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-center">
            最終ランキング
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                  worstPlayers.some(wp => wp.id === player.id)
                    ? 'bg-red-50 border-red-200'
                    : bestPlayers.some(bp => bp.id === player.id)
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className="text-lg">
                      {typeof getRankIcon(index) === 'string' && getRankIcon(index).includes('位') 
                        ? getRankIcon(index) 
                        : getRankIcon(index)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.is_host && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                      {player.id === currentPlayer?.id && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          あなた
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-bold text-gray-800">
                    {player.total_life}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <Card className="shadow-2xl">
        <CardContent className="p-4">
          <Button
            onClick={onBackToTitle}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            タイトルに戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
