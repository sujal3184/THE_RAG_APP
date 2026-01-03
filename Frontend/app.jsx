// ⚠️ IMPORTANT: Change this to your backend URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// Lucide Icons (simple implementation)
const Upload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const Send = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const FileText = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const MessageSquare = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const LogOut = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const Menu = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const X = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const Trash2 = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const LinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;

function RAGChatApp() {
  const [currentView, setCurrentView] = React.useState('login');
  const [token, setToken] = React.useState(() => {
    return localStorage.getItem('token') || '';
  });
  const [user, setUser] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  
  // Auth states
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [authUsername, setAuthUsername] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  
  // Documents
  const [documents, setDocuments] = React.useState([]);
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  
  // Chat
  const [sessions, setSessions] = React.useState([]);
  const [currentSession, setCurrentSession] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [groqApiKey, setGroqApiKey] = React.useState(() => {
    return localStorage.getItem('groqApiKey') || '';
  });
  const [loading, setLoading] = React.useState(false);
  
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    if (token) {
      fetchUser();
      fetchDocuments();
      fetchSessions();
    }
  }, [token]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setCurrentView('chat');
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
      } else {
        setAuthError(data.detail || 'Login failed');
      }
    } catch (err) {
      setAuthError('Network error. Check if backend is running at ' + API_BASE_URL);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authEmail, 
          username: authUsername, 
          password: authPassword 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentView('login');
        setAuthError('');
        alert('Account created! Please login.');
      } else {
        setAuthError(data.detail || 'Signup failed');
      }
    } catch (err) {
      setAuthError('Network error. Check if backend is running.');
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('login');
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/upload-pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert('PDF uploaded successfully!');
        fetchDocuments();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    
    setUploadingFile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/upload-urls`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls: [urlInput] })
      });
      if (res.ok) {
        alert('URL processed successfully!');
        setUrlInput('');
        fetchDocuments();
      } else {
        alert('URL processing failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setUploadingFile(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSession(sessionId);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !groqApiKey) {
      alert('Please enter a message and Groq API key');
      return;
    }

    const userMessage = { role: 'user', content: inputMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/query`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: userMessage.content,
          session_id: currentSession,
          groq_api_key: groqApiKey
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const aiMessage = { 
          role: 'assistant', 
          content: data.answer, 
          created_at: new Date().toISOString(),
          citations: data.citations 
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentSession(data.session_id);
        fetchSessions();
        localStorage.setItem('groqApiKey', groqApiKey);
      } else {
        const error = await res.json();
        alert(error.detail || 'Query failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this chat?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (currentSession === id) {
          setCurrentSession(null);
          setMessages([]);
        }
        fetchSessions();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (currentView === 'login') {
      handleLogin(e);
    } else {
      handleSignup(e);
    }
  };

  // Login/Signup View
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">RAG Chat</h1>
            <p className="text-gray-600 mt-2">Chat with your documents</p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {authError}
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className={`flex-1 py-2 rounded-lg font-semibold ${currentView === 'login' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('signup')}
              className={`flex-1 py-2 rounded-lg font-semibold ${currentView === 'signup' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {currentView === 'signup' && (
              <input
                type="text"
                placeholder="Username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            />
            <button
              onClick={handleAuthSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              {currentView === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Backend: <code className="bg-white px-2 py-1 rounded text-indigo-600">{API_BASE_URL}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main App View
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare />
              <span className="font-bold text-xl">RAG Chat</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            👤 {user?.username}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex-1 py-3 text-sm font-semibold ${currentView === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
          >
            Chats
          </button>
          <button
            onClick={() => setCurrentView('documents')}
            className={`flex-1 py-3 text-sm font-semibold ${currentView === 'documents' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}
          >
            Documents
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {currentView === 'chat' && (
            <div className="space-y-2">
              <button
                onClick={startNewChat}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
              >
                + New Chat
              </button>
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${currentSession === session.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-100'}`}
                >
                  <div onClick={() => loadSession(session.id)} className="flex-1">
                    <div className="font-medium text-sm">{session.title}</div>
                    <div className="text-xs text-gray-500">{session.message_count} messages</div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>
          )}

          {currentView === 'documents' && (
            <div className="space-y-4">
              {/* Upload Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Upload />
                  {uploadingFile ? 'Uploading...' : 'Upload PDF'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{display: 'none'}}
                />
                
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter URL"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleUrlUpload}
                    disabled={uploadingFile}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <LinkIcon />
                  </button>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-2">
                {documents.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No documents uploaded yet</p>
                  </div>
                )}
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{doc.filename}</div>
                        <div className="text-xs text-gray-500">{doc.chunk_count} chunks</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
          >
            <LogOut />
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
          )}
          <h2 className="text-lg font-semibold">
            {currentSession ? 'Chat Session' : 'New Chat'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <MessageSquare />
                </div>
                <p className="text-lg font-semibold">Start a conversation</p>
                <p className="text-sm">Upload documents and ask questions</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-4 py-3`}>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <div className="text-xs font-semibold text-gray-600">Sources:</div>
                    {msg.citations.map((cite, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        📄 {cite.source} {cite.page && `(Page ${cite.page})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          {!groqApiKey && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <input
                type="password"
                placeholder="Enter your Groq API Key"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <div className="text-xs text-gray-600">
                Get free API key at: <a href="https://console.groq.com" target="_blank" className="text-indigo-600 underline">console.groq.com</a>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about your documents..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              disabled={loading || !groqApiKey}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim() || !groqApiKey}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RAGChatApp />);