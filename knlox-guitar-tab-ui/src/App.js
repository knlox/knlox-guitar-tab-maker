import React, { useEffect, useState } from 'react';
import { getTabs, createTab, updateTab, deleteTab, getTabById } from './services/tabService';
import logo from './logo.svg';
import './App.css';

function App() {
  const [tabs, setTabs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTab, setEditTab] = useState(null);
  const BLANK_TAB = `e|-------------------------------\nB|-------------------------------\nG|-------------------------------\nD|-------------------------------\nA|-------------------------------\nE|-------------------------------\n`;

  const [form, setForm] = useState({ title: '', artist: '', tuning: '', tabContent: '' });

  useEffect(() => {
    setLoading(true);
    getTabs()
      .then(res => setTabs(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const refetch = () => {
    setLoading(true);
    getTabs()
      .then(res => setTabs(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const openNew = () => {
    setEditTab(null);
  setForm({ title: '', artist: '', tuning: '', tabContent: BLANK_TAB });
    setModalOpen(true);
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
    const payload = { ...form };
    const action = editTab ? updateTab(editTab.id, payload) : createTab(payload);
    action
      .then(() => {
        setModalOpen(false);
        refetch();
      })
      .catch(err => console.error(err));
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
                  <pre className="tab-pre">{tab.tabContent}</pre>
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
              <input value={form.tuning} onChange={e => setForm({...form, tuning: e.target.value})} />
              <label>Tab Content</label>
              <textarea value={form.tabContent} onChange={e => setForm({...form, tabContent: e.target.value})} rows={8} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn primary" onClick={handleSave}>Save</button>
                <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default App;
