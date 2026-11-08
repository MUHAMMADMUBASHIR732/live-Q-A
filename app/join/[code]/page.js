import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicQuestion } from "@/lib/serialize";
import AudienceView from "@/components/AudienceView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Join the Q&A | Hexa AskBoard" };

export default async function JoinPage({ params }) {
  const { code } = await params;

  const session = await db.session.findUnique({
    where: { joinCode: code.toUpperCase() },
    include: {
      questions: {
        where: { status: { not: "hidden" } },
        include: { cluster: true },
        orderBy: { upvoteCount: "desc" },
      },
    },
  });
  if (!session) notFound();

  return (
    <AudienceView
      session={{
        id: session.id,
        title: session.title,
        joinCode: session.joinCode,
        status: session.status,
      }}
      initialQuestions={session.questions.map(publicQuestion)}
    />
  );
}
