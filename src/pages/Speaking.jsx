import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import TaskCard from '../components/shared/TaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const speakingTasks = {
  individual: [
    { title: 'Self-introduction', description: 'Prepare and deliver a 1-minute self-introduction covering your interests and goals.', difficulty: 'Easy', duration: '5 min', status: 'completed' },
    { title: 'Picture Description', description: 'Describe a given image in detail, covering what you see and your interpretation.', difficulty: 'Easy', duration: '5 min', status: 'available' },
    { title: 'Topic Presentation – Education', description: 'Give a 2-minute presentation on a topic related to modern education.', difficulty: 'Medium', duration: '10 min', status: 'available' },
    { title: 'Topic Presentation – Technology', description: 'Present your views on how technology affects daily life in a structured manner.', difficulty: 'Medium', duration: '10 min', status: 'available' },
  ],
  groupDiscussion: [
    { title: 'School Cafeteria Proposal', description: 'Discuss proposals for improving the school cafeteria with other candidates.', difficulty: 'Medium', duration: '15 min', status: 'available' },
    { title: 'Environmental Action Plan', description: 'Participate in a group discussion about environmental initiatives for schools.', difficulty: 'Hard', duration: '15 min', status: 'locked' },
    { title: 'Community Service Planning', description: 'Collaborate with group members to plan a community service project.', difficulty: 'Hard', duration: '15 min', status: 'locked' },
  ],
};

export default function Speaking() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          icon="🎤"
          title="Speaking"
          description="Practice individual presentations and group discussions for the HKDSE Speaking exam."
        />

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="bg-muted mb-6 w-full justify-start">
            <TabsTrigger value="individual" className="text-xs sm:text-sm">Individual</TabsTrigger>
            <TabsTrigger value="groupDiscussion" className="text-xs sm:text-sm">Group Discussion</TabsTrigger>
          </TabsList>

          {Object.entries(speakingTasks).map(([key, tasks]) => (
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