import { useState } from 'react';

const SYLLABUS_TOPICS = [
  { group: 'Unit 1: Our Living World 我們的生活世界', topics: [
    'Plate Tectonics 板塊構造',
    'Volcanic Activity 火山活動',
    'Earthquakes 地震',
    'Weathering and Mass Movement 風化與山崩',
    'River Processes and Landforms 河流過程與地貌',
    'Coastal Processes and Landforms 海岸過程與地貌',
  ]},
  { group: 'Unit 2: Our Changing World 我們的轉變世界', topics: [
    'Population Distribution and Change 人口分佈與變化',
    'Migration 移民',
    'Urbanisation 城市化',
    'Urban Land Use 城市土地利用',
    'Rural-Urban Fringe 城鄉邊緣地帶',
  ]},
  { group: 'Unit 3: Our Threatened World 我們面臨威脅的世界', topics: [
    'Climate Change 氣候變化',
    'Desertification 沙漠化',
    'Flooding 洪水',
    'Water Resources 水資源',
    'Energy Resources 能源資源',
    'Food Security 糧食安全',
  ]},
  { group: 'Unit 4: Our Connected World 我們互聯的世界', topics: [
    'Globalisation 全球化',
    'Tourism 旅遊業',
    'Economic Development 經濟發展',
    "China's Development 中國發展",
  ]},
  { group: 'Skills 技能', topics: [
    'Map Reading and Skills 地圖閱讀技巧',
    'Fieldwork and Data Collection 實地考察',
    'Statistical Techniques 統計技巧',
  ]},
];

export default function GeoTopicSelector({ value, onChange }) {
  const [input, setInput] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const allTopics = SYLLABUS_TOPICS.flatMap(g => g.topics);
  const filtered = input ? allTopics.filter(t => t.toLowerCase().includes(input.toLowerCase())) : allTopics;

  const handleInputChange = (v) => {
    setInput(v);
    onChange(v);
    setShowSuggestions(true);
  };

  const handleSelectTopic = (topic) => {
    setInput(topic);
    onChange(topic);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Input field */}
      <div className="relative">
        <input
          className="w-full rounded-xl border border-input px-3 py-2.5 text-sm"
          placeholder="Search or enter a Geography topic..."
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && input && filtered.length > 0 && (
          <>
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              {filtered.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleSelectTopic(topic)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                >
                  <span className="text-primary">✓</span>
                  {topic}
                </button>
              ))}
            </div>
            <div className="fixed inset-0 z-[5]" onClick={() => setShowSuggestions(false)} />
          </>
        )}
      </div>

      {/* Syllabus reference (collapsed) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-semibold px-1 py-1 select-none">
          📋 View Syllabus Topics
        </summary>
        <div className="mt-2 space-y-3 pl-2 border-l border-border">
          {SYLLABUS_TOPICS.map(({ group, topics }) => (
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{group}</p>
              <div className="flex flex-wrap gap-1">
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleSelectTopic(topic)}
                    className="px-2 py-1 rounded-full text-[10px] font-medium border border-border bg-background text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {value && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">Selected: </span>
          <span className="font-semibold text-primary">{value}</span>
        </div>
      )}
    </div>
  );
}