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
  const [topics, setTopics] = useState(SYLLABUS_TOPICS);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [newTopic, setNewTopic] = useState('');

  const currentUnitTopics = topics.find(t => t.group === selectedUnit)?.topics || [];

  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setSelectedSubtopic('');
    onChange(unit);
  };

  const handleSubtopicChange = (subtopic) => {
    setSelectedSubtopic(subtopic);
    onChange(`${selectedUnit} - ${subtopic}`);
  };

  const addTopic = (groupIdx) => {
    if (!newTopic.trim()) return;
    const newTopics = [...topics];
    newTopics[groupIdx].topics = [...newTopics[groupIdx].topics, newTopic];
    setTopics(newTopics);
    setNewTopic('');
  };

  const removeTopic = (groupIdx, topicIdx) => {
    const newTopics = [...topics];
    newTopics[groupIdx].topics = newTopics[groupIdx].topics.filter((_, idx) => idx !== topicIdx);
    setTopics(newTopics);
  };

  const editGroupName = (groupIdx, newName) => {
    const newTopics = [...topics];
    newTopics[groupIdx].group = newName;
    setTopics(newTopics);
  };

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-xl border border-input px-3 py-2.5 text-sm"
        placeholder="Or enter custom topic... e.g. Plate Tectonics, Climate Change"
        value={value}
        onChange={e => onChange(e.target.value)}
      />

      {/* Unit selector (compulsory) */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Unit (Required) 單元</label>
        {editMode ? (
          <div className="space-y-2">
            {topics.map(({ group }, idx) => (
              <div key={group} className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-lg border border-input px-3 py-2 text-sm"
                  value={group}
                  onChange={e => editGroupName(idx, e.target.value)}
                />
                <button
                  onClick={() => {
                    const newTopics = topics.filter((_, i) => i !== idx);
                    setTopics(newTopics);
                    if (selectedUnit === group) setSelectedUnit('');
                  }}
                  className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newGroup = `Unit ${topics.length + 1}`;
                setTopics([...topics, { group: newGroup, topics: [] }]);
              }}
              className="w-full px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 font-semibold"
            >
              + Add Unit
            </button>
          </div>
        ) : (
          <select
            value={selectedUnit}
            onChange={e => handleUnitChange(e.target.value)}
            className="w-full rounded-xl border border-input px-3 py-2.5 text-sm"
          >
            <option value="">Select a unit...</option>
            {topics.map(({ group }) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        )}
      </div>

      {/* Subtopic selector (optional) */}
      {selectedUnit && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Sub-topic (Optional) 細題</label>
          <div className="grid grid-cols-2 gap-2">
            {currentUnitTopics.map((topic, idx) => (
              <button
                key={topic}
                onClick={() => handleSubtopicChange(topic)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all text-left ${selectedSubtopic === topic ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-foreground hover:bg-primary/5'}`}
              >
                {topic}
              </button>
            ))}
          </div>
          {editMode && (
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 px-2 py-1.5 rounded border border-input text-xs"
                placeholder="Add new topic"
                value={editGroup === topics.findIndex(t => t.group === selectedUnit) ? newTopic : ''}
                onChange={e => {
                  setEditGroup(topics.findIndex(t => t.group === selectedUnit));
                  setNewTopic(e.target.value);
                }}
              />
              <button
                onClick={() => addTopic(topics.findIndex(t => t.group === selectedUnit))}
                className="px-2 py-1.5 bg-primary text-white rounded text-xs hover:bg-primary/90"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setEditMode(!editMode)}
        className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${editMode ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
      >
        {editMode ? '✓ Done Editing' : '✎ Edit Presets'}
      </button>

      {value && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">Selected: </span>
          <span className="font-semibold text-primary">{value}</span>
        </div>
      )}
    </div>
  );
}