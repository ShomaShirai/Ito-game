"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface JoinTeamScreenProps {
  joinTeamId: string
  setJoinTeamId: (id: string) => void
  onJoinTeam: () => void
  onBackToTitle: () => void
}

export default function JoinTeamScreen({ joinTeamId, setJoinTeamId, onJoinTeam, onBackToTitle }: JoinTeamScreenProps) {
  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600 text-center">チームに参加</CardTitle>
        <CardDescription className="text-center">チームIDを入力してください</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="チームIDを入力"
          value={joinTeamId}
          onChange={(e) => setJoinTeamId(e.target.value.toUpperCase())}
          className="text-center text-lg font-mono"
        />
        <div className="flex gap-2">
          <Button
            onClick={onJoinTeam}
            disabled={!joinTeamId.trim()}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            参加する
          </Button>
          <Button onClick={onBackToTitle} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
            戻る
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
