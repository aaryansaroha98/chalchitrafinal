import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import api from '../api/axios';
import Loader from '../components/Loader';
import Icon from '../components/Icon';

const Team = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/api/team');
      setTeam(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load team members');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading Team" subtitle="Preparing our amazing team..." />;
  }

  return (
    <div className="bg-void" style={{minHeight: '100vh'}}>
      <Container className="team-container" style={{padding: '6rem 2rem 4rem'}}>
        {/* Professional Header */}
        <div className="team-header" style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          marginTop: '-5rem',
          padding: '0 1rem'
        }}>
          <h1 className="team-title" style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: '#0b0e17',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
        OUR TEAM
          </h1>
          <p className="team-subtitle" style={{
            fontSize: '1.1rem',
            color: '#5c6270',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Meet the passionate individuals behind Chalchitra Series
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <Icon name="exclamation-triangle" style={{
              fontSize: '2rem',
              color: '#d64545',
              marginBottom: '1rem',
              display: 'block'
            }} />
            <h4 style={{color: '#d64545', marginBottom: '0.5rem'}}>Unable to Load Team</h4>
            <p style={{color: '#5c6270', margin: 0}}>{error}</p>
          </div>
        )}

        {(() => {
          // Group team members by section
          const foundationTeam = team.filter(member => member.section === 'foundation_team');
          const currentTeam = team.filter(member => member.section === 'current_team');
          const backendTeam = team.filter(member => member.section === 'database_backend_team');

          const renderTeamSection = (sectionTitle, sectionMembers, icon, gradient) => {
            return (
            <div style={{ marginBottom: '4rem' }}>
              <div className="team-section-header" style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div className="team-section-badge" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <Icon name={icon} className="team-section-icon" style={{
                    fontSize: '0.85rem',
                    color: '#5c6270'
                  }} />
                  <h2 className="team-section-title" style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#0b0e17',
                    margin: 0
                  }}>
                    {sectionTitle}
                  </h2>
                </div>
              </div>

              {sectionMembers.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  padding: '3rem 2rem',
                  textAlign: 'center'
                }}>
                  <Icon name={icon} style={{
                    fontSize: '3rem',
                    color: '#8b909c',
                    marginBottom: '1rem',
                    display: 'block'
                  }} />
                  <h4 style={{color: '#0b0e17', marginBottom: '0.5rem'}}>
                    {sectionTitle} - Coming Soon
                  </h4>
                  <p style={{color: '#5c6270', margin: 0}}>
                    We're building an amazing team for this section.
                  </p>
                </div>
              ) : (
                <div className="team-members-grid" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  justifyContent: 'center',
                  alignItems: 'start'
                }}>
                  {sectionMembers.map((member) => {
                    const nameLength = member.name ? member.name.length : 0;
                    const nameFontSize = nameLength > 26 ? '0.95rem' : nameLength > 18 ? '1.05rem' : '1.2rem';

// Helper function to get the full image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Handle paths - if starts with /, use as-is, otherwise add /team/ prefix
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return `${window.location.origin}/team/${url}`;
};

                    return (
                    <div key={member.id} className="team-member-card">
                      {/* Profile Picture */}
                      <div className="team-member-photo">
                        {member.photo_url ? (
                          <img
                            src={getImageUrl(member.photo_url)}
                            alt={member.name}
                          />
                        ) : (
                          <div className="team-member-placeholder">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Member Info with padding */}
                      <div className="team-member-info" style={{padding: '0.75rem'}}>
                        <h4 className="team-member-name" style={{
                          fontSize: nameFontSize,
                          fontWeight: '500',
                          marginBottom: '0.5rem',
                          color: '#0b0e17',
                          lineHeight: '1.2',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}>
                          {member.name}
                        </h4>
                        <p className="team-member-role" style={{
                          fontSize: '0.9rem',
                          color: '#5c6270',
                          fontWeight: '600',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {member.role}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
          };

          return (
            <>
              {renderTeamSection(
                "Founding Team",
                foundationTeam,
                "crown",
                "linear-gradient(135deg, #FFD700, #FFA500)"
              )}

              {renderTeamSection(
                "Current Team",
                currentTeam,
                "users",
                "linear-gradient(135deg, #667EEA, #764BA2)"
              )}

              {renderTeamSection(
                "Database & Backend Management",
                backendTeam,
                "server",
                "linear-gradient(135deg, #11998E, #38EF7D)"
              )}
            </>
          );
        })()}
      </Container>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          @keyframes randomFloat0 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.2; }
            25% { transform: translate(15px, -20px) rotate(90deg); opacity: 0.6; }
            50% { transform: translate(-10px, -40px) rotate(180deg); opacity: 0.3; }
            75% { transform: translate(5px, -20px) rotate(270deg); opacity: 0.5; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.2; }
          }

          @keyframes randomFloat1 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
            33% { transform: translate(-15px, -25px) scale(1.2); opacity: 0.7; }
            66% { transform: translate(20px, -15px) scale(0.8); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          }

          @keyframes randomFloat2 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.25; }
            50% { transform: translate(18px, -22px) rotate(180deg); opacity: 0.6; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.25; }
          }

          @keyframes randomFloat3 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
            25% { transform: translate(10px, -15px) scale(1.3); opacity: 0.5; }
            50% { transform: translate(-8px, -30px) scale(0.9); opacity: 0.3; }
            75% { transform: translate(12px, -15px) scale(1.1); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          }

          @keyframes gentleWave {
            0%, 100% { opacity: 0.2; transform: translateX(-10px); }
            50% { opacity: 0.4; transform: translateX(10px); }
          }

          @keyframes slowRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes slowRotateReverse {
            0% { transform: translate(-50%, -50%) rotate(360deg); }
            100% { transform: translate(-50%, -50%) rotate(0deg); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }

          @keyframes rotateGlow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Team;
