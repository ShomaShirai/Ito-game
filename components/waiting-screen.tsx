"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown } from "lucide-react"
import type { Player } from "@/lib/supabase"

interface WaitingScreenProps {
  teamId: string
  players: Player[]
  onBackToTitle: () => void
}

export default function WaitingScreen({ teamId, players, onBackToTitle }: WaitingScreenProps) {
  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600 text-center">待機中...</CardTitle>
        <CardDescription className="text-center">
          ホストがゲームを開始するまでお待ちください
          <br />
          <span className="text-sm text-gray-500 mt-1 block">
            ゲームが開始されると自動的に画面が切り替わります
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 mb-2">チームID</p>
          <span className="text-xl font-mono font-bold text-purple-600">{teamId}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>参加者 ({players.length}人)</span>
          </div>
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <span className="font-medium">{player.name}</span>
                {player.is_host && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Crown className="h-3 w-3 mr-1" />
                    ホスト
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={onBackToTitle}
          variant="outline"
          className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          タイトルに戻る
        </Button>
      </CardContent>
    </Card>
  )
}
