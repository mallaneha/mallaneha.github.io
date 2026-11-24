// Skills section on the home page (three columns after Projects, src/pages/index.astro) and in /llms.txt.
// Three topics, read left to right: build, protect, comply. Every item comes from the resume
// (docs/reference/); don't add tools Neha hasn't used.
export interface SkillTopic {
  id: string;
  name: string;
  items: string[];
}

// Shown as the muted line under the Skills title.
export const languages = ["Python", "R", "SAS", "SQL", "C", "C++"];

export const skills: SkillTopic[] = [
  {
    id: "ai-systems",
    name: "AI systems",
    items: [
      "LangGraph",
      "LangChain",
      "LangFlow",
      "Milvus",
      "FastMCP",
      "LangSmith tracing & evals",
      "Self-reflection",
      "PyTorch",
      "Scikit-learn",
      "Streamlit",
      "GCP (GKE, Dataproc)",
      "Docker",
      "Terraform",
    ],
  },
  {
    id: "security-privacy",
    name: "AI security & privacy",
    items: [
      "Presidio",
      "OpenMed",
      "Private AI",
      "Reversible pseudonymization",
      "HIPAA",
      "RAG poisoning defenses",
      "NLI checks",
      "OWASP LLM Top 10",
      "Red & blue teaming",
      "Wiz",
    ],
  },
  {
    id: "regulated-data",
    name: "Regulated data",
    items: [
      "CDISC (SDTM, ADaM)",
      "Pinnacle 21",
      "FDA submissions",
      "Tidyverse",
      "PySpark",
      "Kafka",
      "PostgreSQL",
      "Pandas",
      "NumPy",
      "Matplotlib",
      "Seaborn",
    ],
  },
];
