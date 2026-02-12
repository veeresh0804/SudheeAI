import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Filter, SlidersHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import CandidateRankingTable from '@/components/CandidateRankingTable';
import CandidateCard from '@/components/CandidateCard';
import ExplanationModal from '@/components/ExplanationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { rankCandidates, getCandidateById } from '@/services/rankingEngine';
import { generateExplanation } from '@/services/explainabilityEngine';
import { RankedCandidate, RoleType, ExplanationData, Candidate } from '@/types';

const RankingResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState<RankedCandidate[]>([]);
  const [filteredRankings, setFilteredRankings] = useState<RankedCandidate[]>([]);
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [showAnonymized, setShowAnonymized] = useState(false);
  
  // Modal state
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const { jdSkills, roleType, candidateIds } = location.state || {};

  useEffect(() => {
    if (!jdSkills || !roleType) {
      navigate('/recruiter');
      return;
    }

    const loadRankings = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = rankCandidates(jdSkills, roleType as RoleType, candidateIds);
      setRankings(results);
      setFilteredRankings(results);
      setIsLoading(false);
    };

    loadRankings();
  }, [jdSkills, roleType, candidateIds, navigate]);

  useEffect(() => {
    const filtered = rankings.filter(c => c.overallScore >= scoreThreshold);
    setFilteredRankings(filtered);
  }, [scoreThreshold, rankings]);

  const handleViewExplanation = (candidateId: number) => {
    const candidate = getCandidateById(candidateId);
    const rankedCandidate = rankings.find(r => r.candidateId === candidateId);
    
    if (candidate && rankedCandidate) {
      const explanationData = generateExplanation(
        candidateId,
        jdSkills,
        roleType as RoleType,
        rankedCandidate.rank
      );
      
      setExplanation(explanationData);
      setSelectedCandidate(candidate);
      setSelectedCandidateId(candidateId);
    }
  };

  const closeModal = () => {
    setSelectedCandidateId(null);
    setExplanation(null);
    setSelectedCandidate(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner text="Analyzing profiles and computing suitability scores..." size="lg" />
      </div>
    );
  }

  const topCandidate = filteredRankings[0];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/recruiter" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="gradient-text">Candidate Rankings</span>
            </h1>
            <p className="text-muted-foreground">
              Sorted by suitability for: <span className="text-primary font-medium">{roleType}</span> role
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnonymized(!showAnonymized)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showAnonymized ? 'Show Names' : 'Anonymize'}
            </Button>
          </div>
        </div>

        {/* Top Candidate Highlight */}
        {topCandidate && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Top Candidate</h2>
            </div>
            <div className="max-w-md">
              <CandidateCard
                candidate={topCandidate}
                showAnonymized={showAnonymized}
                onViewExplanation={() => handleViewExplanation(topCandidate.candidateId)}
                isHighlighted
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Score</span>
                <span className="font-medium">{scoreThreshold}%</span>
              </div>
              <Slider
                value={[scoreThreshold]}
                onValueChange={([value]) => setScoreThreshold(value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredRankings.length} of {rankings.length} candidates
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {filteredRankings.length > 0 ? (
            <CandidateRankingTable
              candidates={filteredRankings}
              showAnonymized={showAnonymized}
              onViewExplanation={handleViewExplanation}
            />
          ) : (
            <div className="glass-card p-12 text-center">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No candidates match your criteria</h3>
              <p className="text-muted-foreground">Try lowering the minimum score threshold.</p>
            </div>
          )}
        </div>

        {/* Explanation Modal */}
        <ExplanationModal
          isOpen={selectedCandidateId !== null}
          onClose={closeModal}
          explanation={explanation}
          candidate={selectedCandidate}
        />
      </div>
    </div>
  );
};

export default RankingResults;
