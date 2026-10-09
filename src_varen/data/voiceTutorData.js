const materials = (subject, topicNames) => topicNames.map((topic) => ({
  topic,
  materials: [
    `${subject} Course Notes.pdf`,
    `${topic} Lecture Slides`,
    `Faculty Study Guide — ${topic}`,
  ],
}))

export const voiceTutorCourses = {
  'data-structures': {
    topics: materials('Data Structures', [
      'Arrays',
      'Linked Lists',
      'Stacks',
      'Queues',
      'Trees',
      'Binary Trees',
      'BST',
      'AVL Trees',
      'Graphs',
      'Sorting',
      'Searching',
    ]),
  },
  'database-management-systems': {
    topics: materials('Database Systems', [
      'Relational Model',
      'SQL',
      'Normalization',
      'ER Diagrams',
      'Transactions',
      'Indexing',
      'Joins',
      'Database Design',
    ]),
  },
  'computer-networks': {
    topics: materials('Computer Networks', [
      'Network Fundamentals',
      'OSI Model',
      'TCP/IP',
      'Routing',
      'Transport Layer',
      'Network Security',
      'DNS',
      'Wireless Networks',
    ]),
  },
  'web-technologies': {
    topics: materials('Web Technologies', [
      'HTML and CSS',
      'JavaScript Basics',
      'HTTP and the Web',
      'Responsive Design',
      'React Fundamentals',
      'Web Accessibility',
      'Browser Storage',
    ]),
  },
  'operating-systems': {
    topics: materials('Operating Systems', [
      'Processes and Threads',
      'Process Scheduling',
      'Memory Management',
      'File Systems',
      'Synchronization',
      'Deadlocks',
      'Virtual Memory',
    ]),
  },
  'artificial-intelligence': {
    topics: materials('Artificial Intelligence', [
      'AI Fundamentals',
      'Search Algorithms',
      'Knowledge Representation',
      'Logic and Reasoning',
      'Planning',
      'Machine Learning Basics',
    ]),
  },
  'machine-learning': {
    topics: materials('Machine Learning', [
      'Machine Learning Fundamentals',
      'Supervised Learning',
      'Unsupervised Learning',
      'Regression',
      'Classification',
      'Model Evaluation',
      'Neural Networks',
    ]),
  },
  'software-engineering': {
    topics: materials('Software Engineering', [
      'Software Development Process',
      'Requirements Analysis',
      'Software Design',
      'Testing',
      'Agile Methods',
      'Version Control',
      'Software Architecture',
    ]),
  },
  'computer-architecture': {
    topics: materials('Computer Architecture', [
      'Computer Organization',
      'Number Systems',
      'CPU and Instruction Cycle',
      'Pipelining',
      'Memory Hierarchy',
      'Cache Memory',
      'Input and Output Systems',
    ]),
  },
}
