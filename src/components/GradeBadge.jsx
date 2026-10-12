import Badge from "./ui/Badge";
import { gradeFor, useGradingScale } from "../utils/grades";

// Letter grade for a mark, coloured by the grading scale in utils/grades.
export default function GradeBadge({ mark }) {
  const { grade, tone } = gradeFor(mark, useGradingScale());
  return <Badge tone={tone}>{grade}</Badge>;
}
