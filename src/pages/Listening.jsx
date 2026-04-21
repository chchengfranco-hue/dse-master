import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import TaskCard from '../components/shared/TaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const listeningTasks = {
  partA: [
    { title: 'Phone Conversation', description: 'Listen to a phone conversation and answer short-response questions.', difficulty: 'Easy', duration: '10 min', status: 'completed' },
    { title: 'Radio Announcement', description: 'Listen to a public announcement and identify key information and details.', difficulty: 'Easy', duration: '10 min', status: 'completed' },
    { title: 'Interview Excerpt', description: 'Listen to a job interview and take notes on key points discussed.', difficulty: 'Medium', duration: '15 min', status: 'available' },
  ],
  partB: [
    { title: 'Lecture – Climate Change', description: 'Listen to a short academic lecture and answer detailed comprehension questions.', difficulty: 'Medium', duration: '20 min', status: 'available' },
    { title: 'Discussion – School Rules', description: 'Listen to a group discussion and identify different speakers\' viewpoints.', difficulty: 'Medium', duration: '20 min', status: 'available' },
    { title: 'News Report', description: 'Listen to a news broadcast and complete a summary with missing information.', difficulty: 'Hard', duration: '25 min', status: 'locked' },
  ],
  integrated: [
    { title: 'Listening + Writing Task', description: 'Listen to a recording and write a response based on what you heard.', difficulty: 'Hard', duration: '30 min', status: 'locked' },
    { title: 'Note-taking Challenge', description: 'Listen to a presentation and create organized notes, then answer questions.', difficulty: 'Hard', duration: '25 min', status: 'locked' },
  ],
};

export default function Listening() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          icon="🎧"
          title="Listening"
          description="Train your listening comprehension with audio exercises at various difficulty levels."
        />

        <Tabs defaultValue="partA" className="w-full">
          <TabsList className="bg-muted mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="partA" className="text-xs sm:text-sm">Part A</TabsTrigger>
            <TabsTrigger value="partB" className="text-xs sm:text-sm">Part B</TabsTrigger>
            <TabsTrigger value="integrated" className="text-xs sm:text-sm">Integrated</TabsTrigger>
          </TabsList>

          {Object.entries(listeningTasks).map(([key, tasks]) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-3">
                {tasks.map((task, i) => (
                  <TaskCard key={i} {...task} index={i + 1} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}