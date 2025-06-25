"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Eye, Hash, Target } from "lucide-react"
import { PlayerNumber, Topic, Player, supabase } from "@/lib/supabase"

interface WatchOwnNumberProps {
  currentPlayer: Player | null
  playerNumbers: PlayerNumber[]
  currentTopic: Topic | null
  onBackToTitle: () => void
  onSendMatchWord: (matchWord: string) => Promise<void>
}

export default function WatchOwnNumber({ 
  currentPlayer, 
  playerNumbers, 
  currentTopic,
  onBackToTitle,
  onSendMatchWord
}: WatchOwnNumberProps) {
  const [matchWord, setMatchWord] = useState<string>("") // プレイヤーが入力した数字に当てはまる表現
  const [showNumber, setShowNumber] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // 現在のプレイヤーの数字を取得
  const myNumber = currentPlayer 
    ? playerNumbers.find(pn => pn.player_id === currentPlayer.id)
    : null

  // 表現送信処理
  const handleSendMatchWord = async () => {
    if (!matchWord.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSendMatchWord(matchWord);
      // 送信成功後は入力フィールドをクリア
      setMatchWord("");
    } catch (error) {
      console.error("表現送信エラー:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* トピック表示カード */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-purple-600 text-center flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            今回のお題
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {currentTopic ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {currentTopic.category}
              </Badge>
              <div className="text-lg font-semibold text-gray-800">
                {currentTopic.title}
              </div>
              {currentTopic.description && (
                <p className="text-sm text-gray-600">
                  {currentTopic.description}
                </p>
              )}
            </div>
          ) : (
            <div className="text-gray-500">トピックを取得中...</div>
          )}
        </CardContent>
      </Card>

      {/* 数字表示カード */}
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Hash className="h-5 w-5" />
            あなたの数字
          </CardTitle>
          <CardDescription className="text-center text-sm text-gray-600">
            この数字をお題に沿って表現してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {!showNumber ? (
              <div className="space-y-4">
                <div className="bg-gray-100 p-8 rounded-lg">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">タップして数字を確認</p>
                </div>
                <Button
                  onClick={() => setShowNumber(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  数字を見る
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 rounded-lg text-white">
                  {myNumber ? (
                    <div className="text-6xl font-bold">
                      {myNumber.number}
                    </div>
                  ) : (
                    <div className="text-gray-300">数字を取得中...</div>
                  )}
                </div>
                <Button
                  onClick={() => setShowNumber(false)}
                  variant="outline"
                  className="w-full"
                >
                  数字を隠す
                </Button>
              </div>
            )}
          </div>

          {/* 表現入力エリア */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              あなたの表現を入力してください
            </label>
            <Input
              placeholder="例：とても暑い、少し冷たい..."
              value={matchWord}
              onChange={(e) => setMatchWord(e.target.value)}
              className="text-center"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 text-center">
              ※ 具体的な数字は言わないでください
            </p>
            {/* 既に送信済みの表現を表示 */}
            {myNumber?.match_word && (
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <p className="text-sm text-green-700">
                  送信済み: {myNumber.match_word}
                </p>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleSendMatchWord}
              disabled={!matchWord.trim() || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "送信中..." : "表現を送信"}
            </Button>
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

