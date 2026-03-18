import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Search, Briefcase, User, MapPin, Star, ChevronRight, LayoutDashboard } from 'lucide-react';
import './App.css';

// ⚠️ IMPORTANT: If deploying to Vercel and using Cloudflare, change this URL!
// e.g., const API_BASE_URL = 'https://your-cloudflare-link.trycloudflare.com';
const API_BASE_URL = 'https://tested-occupied-pirates-dangerous.trycloudflare.com';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 

  const [activeTab, setActiveTab] = useState('seeker'); 
  const [formData, setFormData] = useState({ full_name: '', location: '', experience_years: '', preferred_role: '' });
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Intro Animation Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Handle Resume Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus('Extracting text & generating AI vectors...');
    
    const data = new FormData();
    data.append('full_name', formData.full_name);
    data.append('location', formData.location);
    data.append('experience_years', formData.experience_years);
    data.append('preferred_role', formData.preferred_role);
    data.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/upload-resume/`, data);
      setUploadStatus('✅ Profile vectorized and stored successfully!');
      setFormData({ full_name: '', location: '', experience_years: '', preferred_role: '' });
      setFile(null);
    } catch (error) {
      console.error(error);
      setUploadStatus('❌ Connection error. Is the Python backend running?');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle AI Search
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults([]);
    setExpandedId(null); // Close any open cards

    try {
      const endpoint = activeTab === 'seeker' ? '/search-jobs/' : '/search-candidates/';
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        params: { query: searchQuery, limit: 5 }
      });
      setResults(response.data.matches || []);
    } catch (error) {
      console.error(error);
      alert('Error connecting to AI engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true); 
  };

  // --- VIEW 1: INTRO ---
  if (showIntro) {
    return (
      <div className="intro-screen">
        <div className="pacman-container">
          <div className="pacman"></div>
          <div className="text-container">
            {['j','o','b','i','t','o','o','l'].map((char, index) => (
              <span key={index} className="eaten-char" style={{animationDelay: `${0.4 + (index * 0.25)}s`}}>
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: AUTH ---
  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <LayoutDashboard className="auth-logo" size={32} />
            <h2>Welcome to jobitool</h2>
            <p>{authMode === 'login' ? 'Log in to access your AI dashboard' : 'Create an account to get started'}</p>
          </div>

          <button className="btn-google" onClick={() => setIsAuthenticated(true)}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" />
            Continue with Google
          </button>

          <div className="divider-container">
            <span className="divider-line"></span>
            <span className="divider-text">or continue with email</span>
            <span className="divider-line"></span>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'signup' && (
              <input type="text" placeholder="Full Name" required />
            )}
            <input type="email" placeholder="Work Email" required />
            <input type="password" placeholder="Password" required />
            <button type="submit" className="btn-primary auth-btn">
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // --- VIEW 3: MAIN APP ---
  return (
    <div className="app-container fade-in">
      
      <header className="navbar">
        <div className="logo-section">
          <LayoutDashboard className="logo-icon" size={28} />
          <h1>jobitool</h1>
        </div>
        <div className="nav-tabs">
          <button className={activeTab === 'seeker' ? 'active' : ''} onClick={() => { setActiveTab('seeker'); setResults([]); setExpandedId(null); }}>
            For Candidates
          </button>
          <button className={activeTab === 'hr' ? 'active' : ''} onClick={() => { setActiveTab('hr'); setResults([]); setExpandedId(null); }}>
            For Recruiters
          </button>
          <button className="btn-logout" onClick={() => setIsAuthenticated(false)}>Log Out</button>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-section">
          <h2>{activeTab === 'seeker' ? 'Find the job that fits your vector.' : 'Discover talent using semantic search.'}</h2>
          <p>Powered by AI Sentence Transformers and Vector Databases.</p>
        </div>

        <div className="search-container">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder={activeTab === 'seeker' ? "E.g. Python backend developer with React experience..." : "Describe your ideal candidate..."}
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              required 
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Scanning Vectors...' : 'AI Search'}
            </button>
          </form>
        </div>

        <div className="content-grid">
          
          {/* UPLOAD CARD */}
          {activeTab === 'seeker' && (
            <div className="upload-card fade-in">
              <div className="card-header">
                <UploadCloud className="card-icon" />
                <h3>Upload Profile</h3>
              </div>
              <form onSubmit={handleUpload} className="upload-form">
                <input type="text" placeholder="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                <div className="form-row">
                  <input type="text" placeholder="Location" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  <input type="number" placeholder="Years Exp." required value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: e.target.value})} />
                </div>
                <input type="text" placeholder="Preferred Role" required value={formData.preferred_role} onChange={e => setFormData({...formData, preferred_role: e.target.value})} />
                
                <div className="file-drop-zone">
                  <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files[0])} id="file-upload" />
                  <label htmlFor="file-upload" className="file-label">
                    {file ? file.name : '📄 Click to select PDF Resume'}
                  </label>
                </div>
                
                <button type="submit" className="btn-primary" disabled={isUploading}>
                  {isUploading ? 'Processing...' : 'Vectorize & Save'}
                </button>
              </form>
              {uploadStatus && <div style={{marginTop: '15px', fontSize: '14px', color: uploadStatus.includes('✅') ? '#16a34a' : '#ef4444', fontWeight: '600', textAlign: 'center'}}>{uploadStatus}</div>}
            </div>
          )}

          {/* RESULTS SECTION */}
          <div className={`results-section ${activeTab === 'hr' ? 'full-width' : ''}`}>
            {results.length === 0 && !isLoading && (
              <div className="empty-state fade-in">
                <Briefcase size={48} className="empty-icon" />
                <p>Enter a query above to see AI-matched results.</p>
              </div>
            )}

            {results.map((result, idx) => {
              const score = (result.similarity * 100).toFixed(1);
              const skillArray = result.skills ? result.skills.split(',').slice(0, 5) : [];

              return (
                <div 
                  key={idx} 
                  className="result-card slide-up" 
                  style={{ animationDelay: `${idx * 0.1}s` }} 
                >
                  <div className="result-header">
                    <div>
                      <h3>{activeTab === 'seeker' ? result.job_title : result.full_name}</h3>
                      <p className="subtitle">
                        {activeTab === 'seeker' ? <><Briefcase size={14}/> {result.company_name}</> : <><User size={14}/> Candidate Profile</>}
                        <span className="divider">•</span>
                        <MapPin size={14}/> {result.location}
                      </p>
                    </div>
                    <div className="score-container">
                      <div className="score-text"><Star size={14} className="star-icon" fill={score > 75 ? "#8b5cf6" : "none"}/> {score}% Match</div>
                      <div className="score-bar-bg">
                        <div className="score-bar-fill" style={{ width: `${score}%`, backgroundColor: score > 75 ? '#8b5cf6' : '#d946ef' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="result-body">
                    {activeTab === 'seeker' ? (
                      <span className="badge">{result.work_type}</span>
                    ) : (
                      <div className="skills-section">
                        {skillArray.length > 0 ? (
                          <div className="skill-pill-container">
                            {skillArray.map((skill, i) => (
                              <span key={i} className="skill-pill">{skill.trim()}</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#64748b' }}>Matched via semantic resume analysis</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* EXPAND BUTTON */}
                  <button 
                    className="btn-secondary" 
                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                  >
                    {expandedId === idx ? 'Close Details' : 'View Details'} 
                    <ChevronRight size={16} style={{ transition: 'transform 0.3s', transform: expandedId === idx ? 'rotate(90deg)' : 'rotate(0deg)' }}/>
                  </button>

                  {/* SMART EXPANDED MENU */}
                  {expandedId === idx && (
                    <div className="slide-up" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      
                      {activeTab === 'seeker' ? (
                        <>
                          <div style={{ marginBottom: '20px' }}>
                              <p style={{ fontSize: '15px', color: '#334155', marginBottom: '12px' }}>
                                  <strong>Role:</strong> {result.role || 'Not specified'} &nbsp;|&nbsp; <strong>Exp. Required:</strong> {result.min_exp}-{result.max_exp} yrs
                              </p>
                              <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  <strong>Job Description:</strong><br/><br/>
                                  {result.combined_text ? result.combined_text : "No detailed description available."}
                              </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                              <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => alert(`Applying for ${result.job_title} at ${result.company_name}...`)}>
                                🚀 One-Click Apply
                              </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '20px' }}>
                              <p style={{ fontSize: '15px', color: '#334155', marginBottom: '12px' }}>
                                  <strong>Experience:</strong> {result.experience_years} years
                              </p>
                              <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  <strong>AI Extracted Summary:</strong><br/><br/>
                                  {result.resume_summary ? result.resume_summary : "No resume text available for this candidate."}
                              </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                              <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => alert(`Opening email to contact ${result.full_name || 'candidate'}...`)}>
                                ✉️ Contact Candidate
                              </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;