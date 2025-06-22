"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, MessageCircle, Target, Heart } from "lucide-react"

interface TitleScreenProps {
  playerName: string
  setPlayerName: (name: string) => void
  onCreateTeam: () => void
  onJoinTeam: () => void
}

export default function TitleScreen({ playerName, setPlayerName, onCreateTeam, onJoinTeam }: TitleScreenProps) {
  return (
    <div className="space-y-6">
      <Card className="text-center shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-4xl font-bold text-purple-600 mb-2">ito</CardTitle>
          <CardDescription className="text-lg text-gray-600">協力型パーティーゲーム</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="あなたの名前を入力"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="text-center text-lg"
          />
          <div className="space-y-3">
            <Button
              onClick={onCreateTeam}
              disabled={!playerName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-semibold"
            >
              チームを作る
            </Button>
            <Button
              onClick={onJoinTeam}
              disabled={!playerName.trim()}
              variant="outline"
              className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 py-3 text-lg font-semibold"
            >
              チームに参加する
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ルール説明カード */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            ゲームのルール
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">1. カード配布</h4>
                <p className="text-sm text-gray-600">各プレイヤーに1〜100の数字カードを配布</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-pink-100 p-2 rounded-full">
                <MessageCircle className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">2. テーマ表現</h4>
                <p className="text-sm text-gray-600">お題に沿って自分の数字を表現（数字は言えません）</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Heart className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">3. 協力して並び替え</h4>
                <p className="text-sm text-gray-600">みんなで協力して数字の小さい順に並び替えよう！</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">💡 例：テーマが「暑さ」の場合</p>
            <p className="text-xs text-yellow-700 mt-1">数字が小さい→「涼しい」、数字が大きい→「とても暑い」を表現</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
