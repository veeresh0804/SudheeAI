import React from 'react';
import { RankedCandidate } from '@/types';
import { Trophy, Medal, Award, Eye, Code2, Github, Linkedin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CandidateRankingTableProps {
  candidates: RankedCandidate[];
  showAnonymized?: boolean;
  onViewExplanation: (candidateId: number) => void;
}

const CandidateRankingTable: React.FC<CandidateRankingTableProps> = ({
  candidates,
  showAnonymized = false,
  onViewExplanation
}) => {
  const getRankBadge = (rank: number) => {
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-sm";
    
    switch (rank) {
      case 1:
        return (
          <div className={`${baseClasses} bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30`}>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </div>
        );
      case 2:
        return (
          <div className={`${baseClasses} bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30`}>
            <Medal className="w-4 h-4 text-gray-400" />
          </div>
        );
      case 3:
        return (
          <div className={`${baseClasses} bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30`}>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-muted border-border text-muted-foreground`}>
            {rank}
          </div>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-16 text-muted-foreground">Rank</TableHead>
            <TableHead className="text-muted-foreground">Candidate</TableHead>
            <TableHead className="text-muted-foreground w-32">Overall</TableHead>
            <TableHead className="text-muted-foreground w-20 text-center">
              <div className="flex items-center justify-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-leetcode" />
                <span className="hidden sm:inline">LC</span>
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground w-20 text-center">
              <div className="flex items-center justify-center gap-1">
                <Github className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GH</span>
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground w-20 text-center">
              <div className="flex items-center justify-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-linkedin" />
                <span className="hidden sm:inline">LI</span>
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate, index) => (
            <TableRow 
              key={candidate.candidateId}
              className="hover:bg-muted/30 border-border transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell>{getRankBadge(candidate.rank)}</TableCell>
              
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                    {(showAnonymized ? candidate.anonymizedName : candidate.name).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {showAnonymized ? candidate.anonymizedName : candidate.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {candidate.summary}
                    </p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(candidate.overallScore)}`}>
                      {candidate.overallScore}%
                    </span>
                  </div>
                  <Progress value={candidate.overallScore} className="h-1.5 w-20" />
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <span className={`font-semibold ${getScoreColor(candidate.platformScores.leetcode)}`}>
                  {candidate.platformScores.leetcode}
                </span>
              </TableCell>
              
              <TableCell className="text-center">
                <span className={`font-semibold ${getScoreColor(candidate.platformScores.github)}`}>
                  {candidate.platformScores.github}
                </span>
              </TableCell>
              
              <TableCell className="text-center">
                <span className={`font-semibold ${getScoreColor(candidate.platformScores.linkedin)}`}>
                  {candidate.platformScores.linkedin}
                </span>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewExplanation(candidate.candidateId)}
                  className="text-primary hover:text-primary/80"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Explain
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CandidateRankingTable;
