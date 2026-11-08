import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicQuestion } from "@/lib/serialize";
import PresenterBoard from "@/components/PresenterBoard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Presenter board | Askboard" };

export default async function PresentPage({ params }) {
  const { id } = await params;

  const session = await db.session.findUnique({
    where: { id },
    include: {
      questions: {
        where: { status: { not: "hidden" } },
        include: { cluster: true },
        orderBy: { upvoteCount: "desc" },
      },
    },
  });
  if (!session) notFound();

  // Never pass presenterToken to the client. It lives in the presenter's browser only.
  return (
    <PresenterBoard
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
