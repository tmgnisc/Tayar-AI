import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Code2, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/config/api';

interface LeaderboardUser {
  rank: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  total_submissions: number;
  accepted_submissions: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  favorite_language: string | null;
  streak_days: number;
  total_score: number;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/code/leaderboard?limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Code2 className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet. Be the first!</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <div>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Top coders this month</p>
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user) => (
          <div
            key={user.user_id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${
              user.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20' : 'bg-muted/30'
            }`}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-12 flex items-center justify-center">
              {getRankIcon(user.rank)}
            </div>

            {/* Avatar & Name */}
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
              />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                {user.rank <= 3 && (
                  <Badge className={`${getRankBadgeColor(user.rank)} text-xs px-2 py-0.5`}>
                    Top {user.rank}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {user.accepted_submissions} solved
                </span>
                {user.favorite_language && (
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    {user.favorite_language}
                  </span>
                )}
                {user.streak_days > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {user.streak_days} day streak
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <div className="text-xl font-bold text-primary">{user.total_score}</div>
              <div className="text-xs text-muted-foreground">points</div>
              <div className="flex gap-1 mt-1 justify-end">
                {user.easy_solved > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                    {user.easy_solved}E
                  </Badge>
                )}
                {user.medium_solved > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    {user.medium_solved}M
                  </Badge>
                )}
                {user.hard_solved > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                    {user.hard_solved}H
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          <strong>Scoring:</strong> Easy = 1pt, Medium = 2pts, Hard = 3pts
        </p>
      </div>
    </Card>
  );
};



