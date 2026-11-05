import { db } from "@/lib/server/admin-data";
import { Card, Empty, Field } from "@/components/admin/ui";
import { deleteFaq, saveFaq } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function FaqsAdmin() {
  const d = db();
  const [{ data: faqs }, { data: countries }] = await Promise.all([
    d.from("faqs").select("id,question,answer_md,country_id").order("sort_order"), d.from("countries").select("id,country_name,kind").order("country_name"),
  ]);
  const opts = (sel?: string | null) => <select name="country_id" className="field" defaultValue={sel ?? ""} aria-label="Page"><option value="">Homepage / general</option>{countries?.map((c) => <option key={c.id} value={c.id}>{c.country_name} ({c.kind})</option>)}</select>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card title="Add a question">
        <form action={saveFaq} style={{ display: "grid", gap: 10 }}>
          <Field label="Question"><input name="question" required className="field" /></Field><Field label="Answer"><textarea name="answer" required rows={3} className="field" /></Field>
          <Field label="Shows on">{opts()}</Field><button className="btn btn-primary">Add</button>
        </form>
      </Card>
      {faqs?.length ? faqs.map((f) => (
        <form key={f.id} action={saveFaq} className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
          <input type="hidden" name="id" value={f.id} />
          <input name="question" defaultValue={f.question} className="field" aria-label="Question" /><textarea name="answer" defaultValue={f.answer_md} rows={3} className="field" aria-label="Answer" />{opts(f.country_id)}
          <div style={{ display: "flex", gap: 8 }}><button className="btn btn-dark">Save</button><button className="btn btn-outline" formAction={deleteFaq}>Delete</button></div>
        </form>
      )) : <Empty text="No questions in the database yet — the website is showing its built-in questions. Add one to start your own list." />}
    </div>
  );
}
