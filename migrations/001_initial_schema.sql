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
  total_life INTEGER DEFAULT 3,
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
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Player numbers table
CREATE TABLE player_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  position INTEGER,
  match_word VARCHAR(100)
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
(3, '恋人に求める条件', '恋愛'),
(4, '理想の告白シチュエーション', '恋愛'),
(5, '好きな人にしてしまう行動', '恋愛'),
(6, 'これをしたら浮気だと思うこと', '恋愛'),
(7, '理想のデートプラン', '恋愛'),
(8, '好きな人との思い出', '恋愛'),
(9, '恋人にみられたくないもの', '恋愛'),
(10, '理想の結婚式', '恋愛'),
(11, '理想のクリスマスの過ごし方', '恋愛'),
(12, '恋人としたい旅行先', '恋愛'),
(13, '恋人にされてキュンとしたこと', '恋愛'),
(14, '理想のプロポーズの言葉', '恋愛'),
(15, '恋愛で一番大切にしていること', '恋愛'),
(16, '恋人と喧嘩する原因になりやすいこと', '恋愛'),
(17, '別れを考える瞬間', '恋愛'),
(18, '付き合う前に気にするポイント', '恋愛'),
(19, '理想のカップル像', '恋愛'),
(20, '恋人に言われて傷ついた言葉', '恋愛'),

-- 盛り上がるジャンル (21-40)
(21, '便利なスマホアプリ', '盛り上がる'),
(22, '人気のアルバイト', '盛り上がる'),
(23, 'かっこいいサッカー選手', '盛り上がる'),
(24, 'テンションが上がる曲', '盛り上がる'),
(25, '食べ物のカロリー', '盛り上がる'),
(26, '面白い少年漫画', '盛り上がる'),
(27, '小学生の時に見ていたアニメ', '盛り上がる'),
(28, '人気のYoutuber', '盛り上がる'),
(29, '人気のアーティスト', '盛り上がる'),
(30, '一年のうち，最も楽しみなイベント', '盛り上がる'),
(31, '好きな給食の献立', '盛り上がる'),
(32, 'もうやりたくない学校行事', '盛り上がる'),
(33, '人気のファミレス', '盛り上がる'),
(34, '記憶をなくして読み返したい漫画', '盛り上がる'),
(35, 'カラオケで歌いたくなる曲', '盛り上がる'),
(36, '学生時代にはやったもの', '盛り上がる'),
(37, '大人の趣味', '盛り上がる'),
(38, '子どもの時に人気だった駄菓子', '盛り上がる'),
(39, '寿司ネタの人気', '盛り上がる'),
(40, 'コンビニで買える食べ物の人気', '盛り上がる'),

-- エッチジャンル (41-60)
(41, '好きな異性の部位', 'エッチ'),
(42, 'エッチする場所', 'エッチ'),
(43, 'グループの中での経験人数', 'エッチ'),
(44, '好きなAV女優', 'エッチ'),
(45, 'エロ動画サイト', 'エッチ');
(46, '好きなAV男優', 'エッチ'),
(47, 'エロい周りの女', 'エッチ'),
(48, 'エッチしたい芸能人', 'エッチ'),
(49, 'ちんちんがでかそうなやつ', 'エッチ'),
(50, '脇が臭そうなやつ', 'エッチ');
(51, 'エッチな夢を見たこと', 'エッチ'),
(52, '好きな体位', 'エッチ'),
(53, 'うんこの量が多そうなやつ', 'エッチ'),
(54, '剛毛そうなやつ', 'エッチ'),
(55, '熟女が好きそうなやつ', 'エッチ'),
(56, '好きなフェチ', 'エッチ'),
(57, 'パイパンそうなやつ', 'エッチ'),
(58, '理想のセックスライフ', 'エッチ'),
(59, '好きなコスプレ', 'エッチ'),
(60, '一番興奮するシチュエーション', 'エッチ');
