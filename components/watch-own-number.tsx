"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

import { PlayerNumber } from "@/lib/supabase"

export default function WatchOwnNumber() {
  const [playerNumber, setPlayerNumber] = useState<PlayerNumber | null>(null);
  const [matchWord, setMatchWord] = useState<string>("");
  const [matchNumber, setMatchNumber] = useState<number | null>(null);

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle>あなたの数字</CardTitle>
        <CardDescription className="text-center">
          {playerNumber && (
            <div className="text-2xl font-bold text-purple-600">
              {playerNumber.number}
            </div>
          )}
          {!playerNumber && (
            <div className="text-gray-500">数字を取得中...</div>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

