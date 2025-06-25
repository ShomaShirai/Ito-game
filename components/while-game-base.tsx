// ゲーム中に表示するコンポーネントを切り替えるためのコンポーネント

"use client"

import { useEffect, useState } from "react"
import { Game, Player, PlayerNumber, Topic } from "@/lib/supabase"
import WatchOwnNumber from "@/components/whileGame/watch-own-number"
import ArrangeExpression from "@/components/whileGame/arrange-expression"
import RevealRealOrder from "@/components/whileGame/reveal-real-order"

interface WhileGameBaseProps {
  currentGame: Game | null
  currentPlayer: Player | null
  players: Player[]
  playerNumbers: PlayerNumber[]
  currentTopic: Topic | null
  onBackToTitle: () => void
  onSendMatchWord: (matchWord: string) => Promise<void>
  onSavePlayerOrder: (arrangedPlayerIds: string[]) => Promise<void>
}

export default function WhileGameBase({
  currentGame,
  currentPlayer,
  players,
  playerNumbers,
  currentTopic,
  onBackToTitle,
  onSendMatchWord,
  onSavePlayerOrder
}: WhileGameBaseProps) {
  const [currentPhase, setCurrentPhase] = useState<string>('discuss')

  // ゲームのフェーズが変更されたときに状態を更新
  useEffect(() => {
    if (currentGame?.phase) {
      setCurrentPhase(currentGame.phase)
    }
  }, [currentGame?.phase])

  // フェーズに応じてコンポーネントを切り替え
  const renderPhaseComponent = () => {
    switch (currentPhase) {
      case 'discuss':
        return (
          <WatchOwnNumber
            currentPlayer={currentPlayer}
            playerNumbers={playerNumbers}
            currentTopic={currentTopic}
            onBackToTitle={onBackToTitle}
            onSendMatchWord={onSendMatchWord}
          />
        )
      
      case 'arrange':
        return (
          <ArrangeExpression
            currentPlayer={currentPlayer}
            players={players}
            playerNumbers={playerNumbers}
            onBackToTitle={onBackToTitle}
            onSavePlayerOrder={onSavePlayerOrder}
          />
        )
      
      case 'reveal':
        return (
          <RevealRealOrder
            currentPlayer={currentPlayer}
            players={players}
            playerNumbers={playerNumbers}
            onBackToTitle={onBackToTitle}
          />
        )
      
      case 'result':
        return (
          <div className="text-center text-white">
            <div className="text-xl mb-2">結果フェーズ</div>
            <div className="text-sm">ゲーム結果を表示します</div>
            {/* TODO: 結果表示コンポーネントを実装 */}
          </div>
        )
      
      default:
        return (
          <div className="text-center text-white">
            <div className="text-xl mb-2">読み込み中...</div>
            <div className="text-sm">しばらくお待ちください</div>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      {/* フェーズ表示 */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
          フェーズ: {currentPhase === 'discuss' ? '議論' : 
                   currentPhase === 'arrange' ? '並び替え' : 
                   currentPhase === 'reveal' ? '発表' : 
                   currentPhase === 'result' ? '結果' : '不明'}
        </div>
      </div>
      {/* フェーズに応じたコンポーネント */}
      {renderPhaseComponent()}
    </div>
  )
}


