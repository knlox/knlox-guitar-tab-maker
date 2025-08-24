import React, { useEffect, useState } from 'react';
import { getTabs, createTab, updateTab, deleteTab, getTabById } from './services/tabService';
import logo from './logo.svg';
import './App.css';

function App() {
  const [tabs, setTabs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
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

  const [form, setForm] = useState({ title: '', artist: '', tuning: '', tabContent: '' });
  const [tuningPreset, setTuningPreset] = useState('Standard (E A D G B e)');

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

  const openNew = () => {
    setEditTab(null);
  const strings = TUNING_PRESETS[tuningPreset];
  const scaffold = makeScaffold(strings, 8, 50);
  setForm({ title: '', artist: '', tuning: tuningPreset, tabContent: scaffold });
  setFullscreenContent(scaffold);
  setFullscreenTab(null); // indicate new tab
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
    const processedContent = ensureMinMeasures(form.tabContent, 64);
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
    setFullscreenContent(tab.tabContent || ensureMinMeasures('', 64));
    setFullscreenOpen(true);
  };

  const handleFullscreenSave = () => {
    const processed = ensureMinMeasures(fullscreenContent, 64);
    if (!fullscreenTab) {
      // create new
      const payload = { title: form.title || 'Untitled', artist: form.artist || '', tuning: form.tuning || tuningPreset, tabContent: processed };
      createTab(payload)
        .then(() => {
          setFullscreenOpen(false);
          setFullscreenContent('');
          refetch();
        })
        .catch(err => console.error(err));
    } else {
      const payload = { ...fullscreenTab, tabContent: processed };
      updateTab(fullscreenTab.id, payload)
        .then(() => {
          setFullscreenOpen(false);
          setFullscreenTab(null);
          setFullscreenContent('');
          refetch();
        })
        .catch(err => console.error(err));
    }
  };

  const filtered = tabs.filter(t =>
    `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="brand">
          <img src={logo} className="App-logo" alt="logo" />
          <div>
            <h1>Guitar Tab Maker</h1>
            <p className="subtitle">Browse and preview guitar tabs</p>
          </div>
        </div>
        <div className="controls">
          <input
            className="search"
            placeholder="Search by title or artist..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className="btn primary" onClick={openNew}>New Tab</button>
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
                    <button className="btn" onClick={() => openEdit(tab.id)}>Edit</button>
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
                  setForm({...form, tuning: p, tabContent: makeScaffold(strings, 8, 50)});
                } else {
                  setForm({...form, tuning: p});
                }
              }}>
                {Object.keys(TUNING_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
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
        <div className="modal-backdrop">
          <div className="modal" style={{width: '95%', maxWidth: 'none', height: '90%', overflow: 'hidden'}}>
            <h3>{fullscreenTab ? `Editing: ${fullscreenTab.title || 'Tab'}` : 'New Tab (Full screen editor)'}</h3>
            <div style={{display: 'flex', gap: 8}}>
              <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <input placeholder="Artist" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
              <select value={tuningPreset} onChange={e => { const p=e.target.value; setTuningPreset(p); setForm({...form, tuning: p}); }}>
                {Object.keys(TUNING_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <textarea style={{flex: 1, height: 'calc(100% - 160px)', fontFamily: 'ui-monospace, monospace', marginTop: 8}} value={fullscreenContent} onChange={e => setFullscreenContent(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn primary" onClick={handleFullscreenSave}>Save</button>
              <button className="btn" onClick={() => setFullscreenOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
