import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import TaskCard from '../components/shared/TaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const writingTasks = {
  partA: [
    { title: 'Email Reply – Complaint', description: 'Write a formal email reply addressing a customer complaint about a product.', difficulty: 'Easy', duration: '25 min', status: 'completed' },
    { title: 'Email Reply – Event Invitation', description: 'Reply to an invitation email, accepting and asking for event details.', difficulty: 'Easy', duration: '20 min', status: 'available' },
    { title: 'Short Message – Advice', description: 'Write a short message giving advice to a friend about study habits.', difficulty: 'Easy', duration: '15 min', status: 'available' },
  ],
  partB: [
    { title: 'Argumentative Essay', description: 'Write an essay arguing for or against school uniform policies with clear structure.', difficulty: 'Medium', duration: '45 min', status: 'available' },
    { title: 'Letter to the Editor', description: 'Compose a letter to a newspaper editor about a local community issue.', difficulty: 'Medium', duration: '35 min', status: 'available' },
    { title: 'Short Story', description: 'Write a creative short story based on a given prompt and image stimulus.', difficulty: 'Hard', duration: '50 min', status: 'locked' },
    { title: 'Report Writing', description: 'Write a formal report on a school survey about extracurricular activities.', difficulty: 'Hard', duration: '40 min', status: 'locked' },
  ],
};

export default function Writing() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          icon="✍️"
          title="Writing"
          description="Develop your writing skills with guided tasks covering emails, essays, and creative writing."
        />

        <Tabs defaultValue="partA" className="w-full">
          <TabsList className="bg-muted mb-6 w-full justify-start">
            <TabsTrigger value="partA" className="text-xs sm:text-sm">Part A</TabsTrigger>
            <TabsTrigger value="partB" className="text-xs sm:text-sm">Part B</TabsTrigger>
          </TabsList>

          {Object.entries(writingTasks).map(([key, tasks]) => (
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