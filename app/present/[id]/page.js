import PresenterBoard from "@/components/PresenterBoard";

export const metadata = { title: "Presenter board | Hexa AskBoard" };

// No database work here either. A new session shows instantly from what the browser already knows.
export default async function PresentPage({ params }) {
  const { id } = await params;
  return <PresenterBoard id={id} />;
}
