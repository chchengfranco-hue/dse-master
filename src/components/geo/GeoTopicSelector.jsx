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
  const [customMode, setCustomMode] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  const handlePreset = (topic) => {
    setCustomMode(false);
    onChange(topic);
  };

  const handleCustomChange = (v) => {
    setCustomTopic(v);
    onChange(v);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setCustomMode(false); onChange(''); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!customMode ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}
        >
          📋 Syllabus Topics
        </button>
        <button
          onClick={() => { setCustomMode(true); onChange(customTopic); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${customMode ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}
        >
          ✏️ Custom Topic
        </button>
      </div>

      {customMode ? (
        <input
          className="w-full rounded-xl border border-input px-3 py-2.5 text-sm"
          placeholder="Enter any Geography topic... e.g. Coral Reef Degradation"
          value={customTopic}
          onChange={e => handleCustomChange(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {SYLLABUS_TOPICS.map(({ group, topics }) => (
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5 px-1">{group}</p>
              <div className="flex flex-wrap gap-1.5">
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handlePreset(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${value === topic ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border text-foreground hover:bg-primary/5 hover:border-primary/40'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {value && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">Selected: </span>
          <span className="font-semibold text-primary">{value}</span>
        </div>
      )}
    </div>
  );
}