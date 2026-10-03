import Badge from "./ui/Badge";
import { gradeFor } from "../utils/grades";

// Letter grade (A-F) for a mark, coloured by the grading scale in utils/grades.
export default function GradeBadge({ mark }) {
  const { grade, tone } = gradeFor(mark);
  return <Badge tone={tone}>{grade}</Badge>;
}
