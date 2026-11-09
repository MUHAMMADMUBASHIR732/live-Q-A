import AudienceView from "@/components/AudienceView";

export const metadata = { title: "Join the Q&A | Hexa AskBoard" };

// No database work here. The page shell arrives at once, and the questions load right after.
export default async function JoinPage({ params }) {
  const { code } = await params;
  return <AudienceView code={code.toUpperCase()} />;
}
