"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Zap, Flame } from "lucide-react"
import type { Genre } from "@/lib/supabase"

interface GenreSelectScreenProps {
  onGenreSelect: (genre: Genre) => void
  onBackToWaiting: () => void
}

export default function GenreSelectScreen({ onGenreSelect, onBackToWaiting }: GenreSelectScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)

  const genres = [
    {
      id: "恋愛" as Genre,
      name: "恋愛",
      description: "ドキドキする恋愛トピック",
      icon: Heart,
      color: "bg-pink-500 hover:bg-pink-600",
      textColor: "text-pink-600"
    },
    {
      id: "盛り上がる" as Genre,
      name: "盛り上がる",
      description: "みんなで楽しめるトピック",
      icon: Zap,
      color: "bg-yellow-500 hover:bg-yellow-600",
      textColor: "text-yellow-600"
    },
    {
      id: "エッチ" as Genre,
      name: "エッチ",
      description: "ちょっと大人なトピック",
      icon: Flame,
      color: "bg-red-500 hover:bg-red-600",
      textColor: "text-red-600"
    }
  ]

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600 text-center">
          ジャンル選択
        </CardTitle>
        <CardDescription className="text-center">
          ゲームで使用するトピックのジャンルを選んでください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {genres.map((genre) => {
            const Icon = genre.icon
            const isSelected = selectedGenre === genre.id
            return (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${isSelected 
                    ? `border-purple-500 bg-purple-50 ${genre.textColor}` 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${genre.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{genre.name}</h3>
                    <p className="text-sm text-gray-600">{genre.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => selectedGenre && onGenreSelect(selectedGenre)}
            disabled={!selectedGenre}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            ゲーム開始
          </Button>
          <Button 
            onClick={onBackToWaiting} 
            variant="outline" 
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            戻る
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
