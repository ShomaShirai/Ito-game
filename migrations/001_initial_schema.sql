-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  avatar_color VARCHAR(7) NOT NULL,
  total_score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  topic_id UUID REFERENCES topics(id),
  topic_number INTEGER,
  phase VARCHAR(20) DEFAULT 'discuss' CHECK (phase IN ('discuss', 'arrange', 'reveal', 'result')),
  player_order TEXT[], -- JSON array of player IDs
  correct_order TEXT[], -- JSON array of player IDs in correct order
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Player numbers table
CREATE TABLE player_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  position INTEGER
);

-- Add foreign key constraint for rooms.host_id
ALTER TABLE rooms ADD CONSTRAINT fk_rooms_host_id FOREIGN KEY (host_id) REFERENCES players(id);

-- Create indexes for better performance
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_games_room_id ON games(room_id);
CREATE INDEX idx_player_numbers_game_id ON player_numbers(game_id);
CREATE INDEX idx_player_numbers_player_id ON player_numbers(player_id);

-- Insert sample topics by genre
INSERT INTO topics (number, title, category) VALUES
-- 恋愛ジャンル (1-20)
(1, '初デートで行きたい場所', '恋愛'),
(2, '恋人にもらって嬉しいプレゼント', '恋愛'),
(3, 'ドキドキする瞬間', '恋愛'),
(4, '理想の告白シチュエーション', '恋愛'),
(5, '好きな人にしてしまう行動', '恋愛'),

-- 盛り上がるジャンル (21-40)
(21, '学校でやってはいけないこと', '盛り上がる'),
(22, '先生に怒られそうなこと', '盛り上がる'),
(23, '友達とやりたいゲーム', '盛り上がる'),
(24, 'テンションが上がる曲', '盛り上がる'),
(25, 'みんなでやったら楽しそうなこと', '盛り上がる'),

-- エッチジャンル (41-60)
(41, 'ちょっとドキドキする話題', 'エッチ'),
(42, '大人の雰囲気のある場所', 'エッチ'),
(43, '秘密にしたいこと', 'エッチ'),
(44, 'ちょっと恥ずかしい体験', 'エッチ'),
(45, '夜更かしする理由', 'エッチ');
