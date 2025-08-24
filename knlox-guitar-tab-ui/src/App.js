import React, { useEffect, useState } from 'react';
import { getTabs, createTab, updateTab, deleteTab, getTabById } from './services/tabService';
import { getUserByEmail, createOrUpdateUser, deleteUser, register, login } from './services/userService';
import logo from './logo.svg';
import './App.css';

function App() {
  const [tabs, setTabs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTab, setEditTab] = useState(null);
  const TUNING_PRESETS = {
    'Standard (E A D G B e)': ['e','B','G','D','A','E'].reverse(),
    'Drop D (D A D G B e)': ['e','B','G','D','A','D'].reverse(),
    'Open G (D G D G B D)': ['D','B','G','D','G','D'].reverse(),
    'DADGAD (D A D G A D)': ['D','A','G','D','A','D'].reverse(),
    'Half Step Down (D# A# D# G# C# F#)': ['F#','C#','G#','D#','A#','D#'].reverse(),
    'Open D (D A D F# A D)': ['D','A','F#','D','A','D'].reverse(),
  };

  // produce scaffold in blocks: each block contains one line per string
  // e.g. 6-string block:
  // e|--------------------------------------------------|
  // B|--------------------------------------------------|
  // G|--------------------------------------------------|
  // D|--------------------------------------------------|
  // A|--------------------------------------------------|
  // E|--------------------------------------------------|
  // repeat blockCount times separated by a blank line
  const makeScaffold = (strings, blockCount = 8, dashCount = 50) => {
    const dashLine = '-'.repeat(dashCount);
    const block = strings.map(s => `${s}|${dashLine}|`).join('\n');
    return Array(blockCount).fill(block).join('\n\n') + '\n';
  };

  // ensure content has at least blockCount blocks (separated by blank lines)
  const ensureMinMeasures = (content, blockCount = 8, dashCount = 50) => {
    const strings = TUNING_PRESETS[tuningPreset];
    const scaffoldBlock = strings.map(s => `${s}|${'-'.repeat(dashCount)}|`).join('\n');
    if (!content || content.trim() === '') return Array(blockCount).fill(scaffoldBlock).join('\n\n') + '\n';
    const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
    if (blocks.length >= blockCount) return content;
    const needed = blockCount - blocks.length;
    const extra = Array(needed).fill(scaffoldBlock).join('\n\n');
    return content.trim() + '\n\n' + extra + '\n';
  };

  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState('');
  const [fullscreenTab, setFullscreenTab] = useState(null);
  const [fullscreenEditing, setFullscreenEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [form, setForm] = useState({ title: '', artist: '', tuning: '', tabContent: '' });
  const [tuningPreset, setTuningPreset] = useState('Standard (E A D G B e)');
  const [blockCount, setBlockCount] = useState(8);

  useEffect(() => {
    setLoading(true);
    getTabs()
      .then(res => setTabs(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // load theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) setTheme(saved);
    } catch (e) { /* ignore */ }
  }, []);

  // load profile from localStorage (mock signed in state)
  useEffect(() => {
    try {
      const profile = localStorage.getItem('profile');
      if (profile) setUser(JSON.parse(profile));
    } catch (e) {}
  }, []);

  // if no user, force auth modal on load
  useEffect(() => {
    if (!user) setAuthOpen(true);
  }, [user]);

  // apply theme to document root
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  const refetch = () => {
    setLoading(true);
    getTabs()
      .then(res => setTabs(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const mockSignInWithGoogle = () => {
    // in real app you'd do OAuth; here we'll prompt for email and create profile
    const email = window.prompt('Enter your Google email to sign in (mock)');
    if (!email) return;
    setAuthLoading(true); setAuthError(null);
    const profile = { email, name: email.split('@')[0], theme };
    createOrUpdateUser(profile)
      .then(res => {
        setUser(res.data);
        localStorage.setItem('profile', JSON.stringify(res.data));
        if (res.data.theme) setTheme(res.data.theme);
        setAuthOpen(false);
      })
      .catch(err => {
        console.error(err);
        setAuthError(err.response?.data || err.message || 'Sign in failed');
        alert('Sign in failed: ' + (err.response?.data || err.message));
      })
      .finally(() => setAuthLoading(false));
  };

  const handleRegister = () => {
    if (!authForm.email || !authForm.password) return alert('email and password required');
    setAuthLoading(true); setAuthError(null);
    const payload = { email: authForm.email, password: authForm.password, name: authForm.name, theme };
    console.log('register payload', payload);
    register(payload)
      .then(res => {
        console.log('register success', res.data);
        setUser(res.data);
        localStorage.setItem('profile', JSON.stringify(res.data));
        setAuthOpen(false);
      })
      .catch(err => {
        console.error('register failed, falling back to createOrUpdateUser', err);
        setAuthError('Register endpoint failed, attempting direct user create');
        // fallback: create via /api/users (no password stored in this flow)
        createOrUpdateUser(payload)
          .then(r2 => {
            setUser(r2.data);
            localStorage.setItem('profile', JSON.stringify(r2.data));
            setAuthOpen(false);
          })
          .catch(err2 => {
            console.error('fallback create failed', err2);
            const msg = err2.response?.data || err2.message || 'Registration failed';
            setAuthError(msg);
            alert('Registration failed: ' + msg);
          })
          .finally(() => setAuthLoading(false));
      })
      .finally(() => setAuthLoading(false));
  };

  const handleLogin = () => {
    if (!authForm.email || !authForm.password) return alert('email and password required');
    setAuthLoading(true); setAuthError(null);
    login({ email: authForm.email, password: authForm.password })
      .then(res => {
        if (!res.data) {
          setAuthError('Invalid credentials');
          alert('Invalid credentials');
          return;
        }
        setUser(res.data);
        localStorage.setItem('profile', JSON.stringify(res.data));
        if (res.data.theme) setTheme(res.data.theme);
        setAuthOpen(false);
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data || err.message || 'Login failed';
        setAuthError(msg);
        alert('Login failed: ' + msg);
      })
      .finally(() => setAuthLoading(false));
  };

  const openSettings = () => setSettingsOpen(true);

  const saveSettings = () => {
    if (!user) return;
    const updated = { ...user, theme };
    createOrUpdateUser(updated).then(res => {
      setUser(res.data);
      localStorage.setItem('profile', JSON.stringify(res.data));
      setSettingsOpen(false);
    }).catch(err => console.error(err));
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    deleteUser(user.id).then(() => {
      setUser(null);
      localStorage.removeItem('profile');
      setProfileOpen(false);
    }).catch(err => console.error(err));
  };

  // profile editing state
  const [profileForm, setProfileForm] = useState({ email: '', name: '', password: '' });

  const openProfile = () => {
    if (user) setProfileForm({ email: user.email || '', name: user.name || '', password: '' });
    setProfileOpen(true);
  };

  const saveProfile = () => {
    if (!user) return alert('No user signed in');
    const payload = { ...user, email: profileForm.email, name: profileForm.name };
    // only set password if provided
    if (profileForm.password) payload.password = profileForm.password;
    createOrUpdateUser(payload)
      .then(res => {
        setUser(res.data);
        localStorage.setItem('profile', JSON.stringify(res.data));
        setProfileOpen(false);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save profile: ' + (err.response?.data || err.message));
      });
  };

  const openNew = () => {
    setEditTab(null);
  const strings = TUNING_PRESETS[tuningPreset];
  const scaffold = makeScaffold(strings, blockCount, 50);
  setForm({ title: '', artist: '', tuning: tuningPreset, tabContent: scaffold });
  setFullscreenContent(scaffold);
  setFullscreenTab(null); // indicate new tab
  setFullscreenEditing(true);
  setFullscreenOpen(true);
  };

  const openEdit = (id) => {
    setLoading(true);
    getTabById(id)
      .then(res => {
        setEditTab(res.data);
        setForm({
          title: res.data.title || '',
          artist: res.data.artist || '',
          tuning: res.data.tuning || '',
          tabContent: res.data.tabContent || '',
        });
  // set the tuning preset selector to the saved preset if it exists
  const presetKey = Object.keys(TUNING_PRESETS).includes(res.data.tuning) ? res.data.tuning : tuningPreset;
  setTuningPreset(presetKey);
        setModalOpen(true);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this tab?')) return;
    deleteTab(id)
      .then(() => refetch())
      .catch(err => console.error(err));
  };

  const handleSave = () => {
  const processedContent = ensureMinMeasures(form.tabContent, blockCount);
    const payload = { ...form, tabContent: processedContent };
    const action = editTab ? updateTab(editTab.id, payload) : createTab(payload);
    action
      .then(() => {
        setModalOpen(false);
        refetch();
      })
      .catch(err => console.error(err));
  };

  const openFullscreen = (tab) => {
    setFullscreenTab(tab);
    // set blockCount from the tab if present
    try {
      const blocks = (tab.tabContent || '').split(/\n\s*\n/).filter(b => b.trim() !== '');
      if (blocks.length) setBlockCount(blocks.length);
    } catch (e) {}
    setFullscreenContent(tab.tabContent || ensureMinMeasures('', blockCount));
  setFullscreenEditing(false);
  setFullscreenOpen(true);
  };

  const handleFullscreenSave = () => {
  const processed = ensureMinMeasures(fullscreenContent, blockCount);
    setSaving(true);
    if (!fullscreenTab) {
      // create new
      const payload = { title: form.title || 'Untitled', artist: form.artist || '', tuning: form.tuning || tuningPreset, tabContent: processed };
      createTab(payload)
        .then(() => {
          setFullscreenOpen(false);
          setFullscreenContent('');
          refetch();
          // show saved toast
          setToastVisible(true); setTimeout(() => setToastVisible(false), 1800);
        })
        .catch(err => console.error(err))
        .finally(() => setSaving(false));
    } else {
      const payload = { ...fullscreenTab, tabContent: processed };
      updateTab(fullscreenTab.id, payload)
        .then(() => {
          setFullscreenOpen(false);
          setFullscreenTab(null);
          setFullscreenContent('');
          refetch();
          setToastVisible(true); setTimeout(() => setToastVisible(false), 1800);
        })
        .catch(err => console.error(err))
        .finally(() => setSaving(false));
    }
  };

  // export current fullscreen view to PDF via print dialog
  const exportPdf = () => {
    const title = form.title || (fullscreenTab && fullscreenTab.title) || 'Tab';
    const artist = form.artist || (fullscreenTab && fullscreenTab.artist) || '';
    const content = fullscreenContent || form.tabContent || (fullscreenTab && fullscreenTab.tabContent) || '';
    const currentTheme = theme || 'light';
    const bg = currentTheme === 'dark' ? '#021124' : '#ffffff';
    const color = currentTheme === 'dark' ? '#dbeafe' : '#0f172a';

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            body{font-family: Arial, Helvetica, sans-serif; margin:24px; background:${bg}; color:${color};}
            .hdr{display:flex; justify-content:space-between; align-items:center; margin-bottom:12px}
            .title{font-size:20px; font-weight:700}
            .artist{font-size:14px; color: ${currentTheme === 'dark' ? '#93c5fd' : '#475569'}}
            pre{white-space:pre-wrap; font-family: ui-monospace, monospace; background: transparent; padding:12px; border-radius:8px}
            .card{background: ${currentTheme === 'dark' ? '#071428' : '#f8fafc'}; padding:16px; border-radius:12px}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="hdr"><div><div class="title">${title}</div><div class="artist">${artist}</div></div><div>${new Date().toLocaleString()}</div></div>
            <pre>${content.replace(/</g,'&lt;')}</pre>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) { alert('Unable to open print window - please allow popups.'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.focus(); win.print(); } catch (e) { console.error(e); } }, 500);
  };

    // export as plain text file
    const exportText = () => {
      const title = (form.title || (fullscreenTab && fullscreenTab.title) || 'tab').replace(/[^a-z0-9\-]/gi, '_');
      const content = fullscreenContent || form.tabContent || (fullscreenTab && fullscreenTab.tabContent) || '';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
      const content = fullscreenContent || form.tabContent || (fullscreenTab && fullscreenTab.tabContent) || '';
      try {
        await navigator.clipboard.writeText(content);
        setToastVisible(true); setTimeout(() => setToastVisible(false), 1400);
      } catch (e) {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        setToastVisible(true); setTimeout(() => setToastVisible(false), 1400);
      }
    };

  const filtered = tabs.filter(t =>
    `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="App">
      <header className="App-header" style={{display:'flex', alignItems:'center', gap:16, padding:'12px 20px'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className="brand" style={{display:'flex', alignItems:'center', gap:12}}>
            <img src={logo} className="App-logo" alt="logo" />
            <div>
              <h1 style={{margin:0, fontSize:18}}>Guitar Tab Maker</h1>
              <p className="subtitle">Browse and preview guitar tabs</p>
            </div>
          </div>
          {user ? <div className="tab-meta" style={{fontWeight:700, color:'var(--text)'}}>{`Welcome, ${user.name || 'User'}!`}</div> : null}
        </div>

        <div style={{flex:1, display:'flex', justifyContent:'center'}}>
          <div className="controls" style={{display:'flex', gap:12, alignItems:'center', width:'100%', maxWidth:700}}>
            <input
              className="search"
              placeholder="Search by title or artist..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{flex:1}}
            />
            <button className="btn primary" onClick={openNew}>New Tab</button>
            {user ? null : (
              <button className="btn" onClick={mockSignInWithGoogle}>Sign in with Google</button>
            )}
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', marginLeft: 'auto'}}>
          <button className="btn" onClick={openSettings} title="Settings" style={{fontSize:18, padding:'6px 10px'}} aria-label="Settings">⚙️</button>
        </div>
      </header>

      <main className="container">
        {loading ? (
          <p className="muted">Loading tabs…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No tabs found.</p>
        ) : (
          <section className="tabs-grid">
            {filtered.map(tab => (
                <article className="tab-card" key={tab.id}>
                  <div className="tab-card-header">
                    <h2 className="tab-title">{tab.title}</h2>
                    <div className="tab-meta">{tab.artist}</div>
                  </div>
                  <pre className="tab-pre" onClick={() => openFullscreen(tab)} style={{cursor: 'pointer'}}>{tab.tabContent}</pre>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn" onClick={() => handleDelete(tab.id)}>Delete</button>
                  </div>
                </article>
              ))}
          </section>
        )}
      </main>

        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>{editTab ? 'Edit Tab' : 'New Tab'}</h3>
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <label>Artist</label>
              <input value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
              <label>Tuning</label>
              <select value={tuningPreset} onChange={e => {
                const p = e.target.value;
                setTuningPreset(p);
                const strings = TUNING_PRESETS[p];
                // only regenerate scaffold for new tabs (don't overwrite existing content while editing)
                if (!editTab) {
                  setForm({...form, tuning: p, tabContent: makeScaffold(strings, blockCount, 50)});
                } else {
                  setForm({...form, tuning: p});
                }
              }}>
                {Object.keys(TUNING_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <label>Blocks</label>
              <input type="number" min={1} max={64} value={blockCount} onChange={e => setBlockCount(Math.max(1, Number(e.target.value || 1)))} />
              <label>Tab Content</label>
              <textarea value={form.tabContent} onChange={e => setForm({...form, tabContent: e.target.value})} rows={8} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn primary" onClick={handleSave}>Save</button>
                <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      {fullscreenOpen && (
        <div className="modal-backdrop fullscreen">
          <div className="modal modal-fullscreen">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0}}>{fullscreenTab ? (fullscreenTab.title || 'Tab') : 'New Tab'}</h3>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button className="btn" onClick={() => exportPdf()}>Export PDF</button>
                <button className="btn" onClick={() => exportText()}>Export TXT</button>
                <button className="btn" onClick={() => copyToClipboard()}>Copy</button>
                {!fullscreenEditing ? (
                  <>
                    <button className="btn" onClick={() => {
                      // enter edit mode, initialize form and content
                      setFullscreenEditing(true);
                      setForm({ title: fullscreenTab?.title || form.title || '', artist: fullscreenTab?.artist || form.artist || '', tuning: fullscreenTab?.tuning || tuningPreset, tabContent: fullscreenTab?.tabContent || fullscreenContent || '' });
                      setTuningPreset(fullscreenTab?.tuning || tuningPreset);
                      setFullscreenContent(fullscreenTab?.tabContent || fullscreenContent || '');
                    }}>Edit</button>
                    <button className="btn" onClick={() => setFullscreenOpen(false)}>Close</button>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={() => { setFullscreenEditing(false); /* discard edits visually by resetting fullscreenContent */ setFullscreenContent(fullscreenTab?.tabContent || ''); }}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            {!fullscreenEditing ? (
              <pre className="tab-pre" style={{whiteSpace:'pre-wrap', overflow:'auto', height: 'calc(100% - 56px)', marginTop:12}}>{fullscreenContent}</pre>
            ) : (
              <div style={{display:'flex', flexDirection:'column', height: '100%'}}>
                <div style={{display: 'flex', gap: 8}}>
                  <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <input placeholder="Artist" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
                  <select value={tuningPreset} onChange={e => { const p=e.target.value; setTuningPreset(p); setForm({...form, tuning: p}); }}>
                    {Object.keys(TUNING_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <textarea style={{flex: 1, marginTop:8, fontFamily: 'ui-monospace, monospace'}} value={fullscreenContent} onChange={e => setFullscreenContent(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn primary" onClick={() => {
                    setForm({...form, tabContent: fullscreenContent});
                    handleFullscreenSave();
                  }} disabled={saving}>
                    {saving ? <span className="spinner" style={{marginRight:8}}></span> : null}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button className="btn" onClick={() => { setFullscreenEditing(false); setFullscreenContent(fullscreenTab?.tabContent || ''); }} disabled={saving}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* toast */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>Saved</div>
      {settingsOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Settings</h3>
            <label>Theme</label>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <button
                className="btn"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{padding: '6px 12px', borderRadius: 9999, background: theme === 'dark' ? 'linear-gradient(90deg,#334155,#0f172a)' : 'linear-gradient(90deg,#f8fafc,#e2e8f0)', color: 'var(--text)'}}
              >
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            </div>
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button className="btn primary" onClick={saveSettings}>Save</button>
              <button className="btn" onClick={() => setSettingsOpen(false)}>Close</button>
              <button className="btn" onClick={() => { setSettingsOpen(false); openProfile(); }}>Edit Profile</button>
              <button className="btn" onClick={handleDeleteAccount} style={{marginLeft:'auto', color:'#cc3333'}}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
      {profileOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Profile</h3>
            <label>Email</label>
            <input value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
            <label>Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
            <label>New password (leave blank to keep existing)</label>
            <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} />
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button className="btn primary" onClick={saveProfile}>Save</button>
              <button className="btn" onClick={() => setProfileOpen(false)}>Cancel</button>
              <button className="btn" onClick={handleDeleteAccount} style={{marginLeft:'auto', color:'#cc3333'}}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
      {authOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{isRegister ? 'Register' : 'Login'}</h3>
            <label>Email</label>
            <input value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <label>{isRegister ? 'Name' : 'Password'}</label>
            {isRegister ? (
              <input value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            ) : null}
            <label>Password</label>
            <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            <div style={{display:'flex', gap:8, marginTop:12}}>
              {isRegister ? (
                <button className="btn primary" onClick={handleRegister} disabled={authLoading}>{authLoading ? 'Registering…' : 'Register'}</button>
              ) : (
                <button className="btn primary" onClick={handleLogin} disabled={authLoading}>{authLoading ? 'Logging in…' : 'Login'}</button>
              )}
              <button className="btn" onClick={() => setIsRegister(!isRegister)} disabled={authLoading}>{isRegister ? 'Have an account? Login' : 'Create account'}</button>
              <button className="btn" onClick={mockSignInWithGoogle} disabled={authLoading}>{authLoading ? 'Working…' : 'Sign in with Google'}</button>
            </div>
            {authError ? <p style={{color: 'crimson'}}>{String(authError)}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
