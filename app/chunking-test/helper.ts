export const sampleTexts = {
  resume: `JANE SMITH
Frontend + Full Stack Developer

SKILLS
- JavaScript ES6+, TypeScript
- React.js, Next.js, Redux, Tailwind CSS
- NestJS, Express.js
- MongoDB, REST APIs
- Vite, Webpack, GitHub Actions

EXPERIENCE
Senior Developer at TechCorp (2020-2023)
- Built dynamic web interfaces with React and Tailwind
- Developed scalable backend APIs using NestJS
- Worked in Agile sprints, used Git for CI/CD integration

Junior Developer at StartupXYZ (2018-2020)
- Created responsive web applications
- Implemented user authentication systems
- Collaborated with design team on UI/UX improvements

EDUCATION
BSc in Information Technology
University of Technology, 2018

PROJECTS
E-commerce Frontend (React + Redux)
- Built complete shopping cart functionality
- Implemented user authentication and profiles
- Integrated with payment gateway APIs

Backend Order System (NestJS + MongoDB)
- Designed RESTful API architecture
- Implemented order processing workflow
- Added real-time notifications using WebSockets`,

  job: `Senior Software Engineer - Full Stack

COMPANY OVERVIEW
We are a fast-growing tech company looking for a talented Full Stack Developer to join our engineering team. You will work on cutting-edge web applications and help shape our technical architecture.

REQUIREMENTS
- 5+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript
- Experience with React.js, Node.js, and modern web frameworks
- Knowledge of database design and API development
- Experience with cloud platforms (AWS, Azure, or GCP)
- Understanding of CI/CD pipelines and DevOps practices

RESPONSIBILITIES
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable, and well-tested code
- Participate in code reviews and technical discussions
- Mentor junior developers and share knowledge

TECHNICAL SKILLS
Frontend: React.js, TypeScript, HTML5, CSS3, Redux
Backend: Node.js, Express.js, NestJS, REST APIs
Database: MongoDB, PostgreSQL, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD
Tools: Git, VS Code, Postman, Jira

BENEFITS
- Competitive salary and equity
- Flexible work arrangements
- Professional development opportunities
- Health insurance and wellness programs
- Modern office with latest equipment`,

  longDocument: `CHAPTER 1: INTRODUCTION TO ARTIFICIAL INTELLIGENCE

Artificial Intelligence (AI) represents one of the most transformative technologies of the 21st century. It encompasses a broad range of computational techniques that enable machines to perform tasks that traditionally required human intelligence.

DEFINITION AND SCOPE
AI can be defined as the simulation of human intelligence in machines that are programmed to think and learn like humans. The scope of AI is vast, covering areas such as machine learning, natural language processing, computer vision, robotics, and expert systems.

HISTORICAL PERSPECTIVE
The field of AI has evolved significantly since its inception in the 1950s. Early AI research focused on symbolic reasoning and rule-based systems. The 1980s saw the rise of expert systems, while the 1990s and 2000s brought machine learning to the forefront.

MODERN APPLICATIONS
Today, AI is embedded in countless applications that we use daily. From virtual assistants like Siri and Alexa to recommendation systems on Netflix and Amazon, AI has become ubiquitous in modern technology.

CHAPTER 2: MACHINE LEARNING FUNDAMENTALS

Machine learning is a subset of AI that focuses on algorithms and statistical models that enable computers to improve their performance on a specific task through experience.

SUPERVISED LEARNING
Supervised learning involves training a model on labeled data. The model learns to map input features to known output labels, enabling it to make predictions on new, unseen data.

UNSUPERVISED LEARNING
Unsupervised learning works with unlabeled data, discovering hidden patterns and structures. Clustering and dimensionality reduction are common unsupervised learning techniques.

REINFORCEMENT LEARNING
Reinforcement learning involves an agent learning to make decisions by taking actions in an environment and receiving rewards or penalties based on those actions.

CHAPTER 3: DEEP LEARNING AND NEURAL NETWORKS

Deep learning represents a significant advancement in machine learning, using artificial neural networks with multiple layers to model complex patterns in data.

NEURAL NETWORK ARCHITECTURE
Neural networks consist of interconnected nodes (neurons) organized in layers. The input layer receives data, hidden layers process it, and the output layer produces results.

TRAINING PROCESS
Training a neural network involves adjusting weights and biases to minimize the difference between predicted and actual outputs. This is typically done using gradient descent optimization.

APPLICATIONS IN COMPUTER VISION
Deep learning has revolutionized computer vision, enabling breakthroughs in image recognition, object detection, and image generation. Convolutional Neural Networks (CNNs) are particularly effective for visual tasks.

NATURAL LANGUAGE PROCESSING
In NLP, deep learning models like transformers have achieved remarkable success in tasks such as language translation, text generation, and sentiment analysis.`,
};

export const chunkingMethods = [
  {
    value: "fixed",
    label: "Fixed-Size Chunking",
    description: "Splits text into chunks of fixed size with optional overlap",
  },
  {
    value: "sentence",
    label: "Sentence-Based Chunking",
    description:
      "Splits text at sentence boundaries while respecting max chunk size",
  },
  {
    value: "paragraph",
    label: "Paragraph-Based Chunking",
    description:
      "Splits text at paragraph boundaries while respecting max chunk size",
  },
  {
    value: "semantic",
    label: "Semantic-Based Chunking",
    description:
      "Creates semantically coherent chunks based on content structure",
  },
  {
    value: "agentic",
    label: "Agentic Chunking",
    description: "Uses intelligent rules to create contextually aware chunks",
  },
];
