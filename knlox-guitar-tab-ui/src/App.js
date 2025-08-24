import React, { useEffect, useState } from 'react';
import { getTabs } from './services/tabService';

function App() {
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    getTabs()
      .then(res => setTabs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Guitar Tabs</h1>
      {tabs.length === 0 ? (
        <p>No tabs found.</p>
      ) : (
        <ul>
          {tabs.map(tab => (
            <li key={tab.id}>
              <h2>{tab.title} - {tab.artist}</h2>
              <pre>{tab.tabContent}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
