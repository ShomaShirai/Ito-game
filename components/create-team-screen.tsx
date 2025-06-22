"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, Copy, Check } from "lucide-react"
import type { Player } from "@/lib/supabase"

interface CreateTeamScreenProps {
  teamId: string
  players: Player[]
  onStartGame: () => void
  onBackToTitle: () => void
}

export default function CreateTeamScreen({ teamId, players, onStartGame, onBackToTitle }: CreateTeamScreenProps) {
  const [copied, setCopied] = useState(false)

  const copyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(teamId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy team ID:", err)
    }
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600 text-center flex items-center justify-center gap-2">
          <Crown className="h-6 w-6" />
          チーム作成
        </CardTitle>
        <CardDescription className="text-center">他のプレイヤーにチームIDを共有してください</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 mb-2">チームID</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold text-purple-600">{teamId}</span>
            <Button onClick={copyTeamId} variant="ghost" size="sm" className="h-8 w-8 p-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
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

        <div className="flex gap-2">
          <Button
            onClick={onStartGame}
            disabled={players.length < 2}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            ゲーム開始
          </Button>
          <Button onClick={onBackToTitle} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
            戻る
          </Button>
        </div>

        {players.length < 2 && <p className="text-sm text-gray-500 text-center">ゲーム開始には2人以上必要です</p>}
      </CardContent>
    </Card>
  )
}
