// Skills section on the home page (src/components/Skills.astro) and in /llms.txt.
// Three topics, read left to right: build, protect, comply. Every item comes from the resume
// (docs/reference/); don't add tools Neha hasn't used.
import type { IconName } from "./icons";

export interface SkillTopic {
  id: string;
  name: string;
  verb: string; // the muted line under the name
  icon: IconName;
  items: string[];
}

export const skills: SkillTopic[] = [
  {
    id: "ai-systems",
    name: "AI systems",
    verb: "Build",
    icon: "flow",
    items: [
      "LangGraph",
      "LangChain",
      "Milvus",
      "FastMCP",
      "LangSmith tracing & evals",
      "Self-reflection",
      "GKE",
      "Docker",
      "Terraform",
    ],
  },
  {
    id: "security-privacy",
    name: "AI security & privacy",
    verb: "Protect",
    icon: "shield",
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
    verb: "Comply",
    icon: "table",
    items: [
      "CDISC (SDTM, ADaM)",
      "Pinnacle 21",
      "FDA submissions",
      "SAS",
      "R",
      "PySpark",
      "Kafka",
      "PostgreSQL",
    ],
  },
];
