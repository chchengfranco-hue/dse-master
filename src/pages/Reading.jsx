import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import TaskCard from '../components/shared/TaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const readingTasks = {
  partA: [
    { title: 'Email Exchange – School Event', description: 'Read an email chain about organizing a school charity event and answer comprehension questions.', difficulty: 'Easy', duration: '15 min', status: 'completed' },
    { title: 'Magazine Article – Technology', description: 'Analyze an article about AI in education with vocabulary and inference questions.', difficulty: 'Medium', duration: '20 min', status: 'available' },
    { title: 'Blog Post – Travel Experience', description: 'Read a travel blog entry and identify main ideas, tone, and writer purpose.', difficulty: 'Easy', duration: '15 min', status: 'available' },
  ],
  partB1: [
    { title: 'Short Story Comprehension', description: 'Read a short fiction piece and answer questions on plot, characters, and themes.', difficulty: 'Medium', duration: '25 min', status: 'available' },
    { title: 'News Report Analysis', description: 'Analyze a newspaper article on environmental issues with critical thinking tasks.', difficulty: 'Hard', duration: '30 min', status: 'locked' },
    { title: 'Poem Interpretation', description: 'Read and interpret a contemporary poem with figurative language questions.', difficulty: 'Hard', duration: '25 min', status: 'locked' },
  ],
  partB2: [
    { title: 'Non-fiction – Science Article', description: 'Read a science article and answer questions requiring analysis and evaluation.', difficulty: 'Medium', duration: '25 min', status: 'available' },
    { title: 'Argumentative Essay', description: 'Analyze an opinion piece on social media regulation with structured response questions.', difficulty: 'Hard', duration: '30 min', status: 'locked' },
    { title: 'Report and Data Analysis', description: 'Read a report with charts and answer questions integrating textual and visual data.', difficulty: 'Hard', duration: '35 min', status: 'locked' },
  ],
};

export default function Reading() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          icon="📖"
          title="Reading"
          description="Practice reading comprehension across different text types and difficulty levels."
        />

        <Tabs defaultValue="partA" className="w-full">
          <TabsList className="bg-muted mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="partA" className="text-xs sm:text-sm">Part A</TabsTrigger>
            <TabsTrigger value="partB1" className="text-xs sm:text-sm">Part B1</TabsTrigger>
            <TabsTrigger value="partB2" className="text-xs sm:text-sm">Part B2</TabsTrigger>
          </TabsList>

          {Object.entries(readingTasks).map(([key, tasks]) => (
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