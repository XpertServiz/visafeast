import { db } from "@/lib/server/admin-data";
import { readMessages } from "@/lib/server/portal";
import { Badge, Card, Empty } from "./ui";
import { ChatThread } from "@/components/portal/ChatThread";
import { DocUpload } from "@/components/portal/DocUpload";
import { PortalAccess } from "./PortalAccess";
import { requestDoc, reviewDoc, toggleCaseDoc } from "@/app/admin/actions";

const UP = { choose: "Add a file for the client", busy: "Sending…", tooBig: "Bigger than 10 MB.", failed: "Could not upload. Try again.", done: "Added." };
const CHAT = { placeholder: "Write to the client…", send: "Send", empty: "No messages yet. Write to ask for anything you need.", me: "You", them: "Client", failed: "Could not send." };
export const STATUS_COLOUR: Record<string, string> = { missing: "var(--muted-2)", uploaded: "var(--amber-text)", approved: "var(--ok)", rejected: "var(--bad)" };
export const STATUS_LABEL: Record<string, string> = { missing: "Waiting", uploaded: "To check", approved: "Approved", rejected: "Asked again" };

/** Everything about one client's documents and conversation: used on the case page and the client page. */
export async function ClientFile({ personId, caseId, path }: { personId: string; caseId?: string; path: string }) {
  const d = db();
  const { data: person } = await d.from("people").select("full_name,whatsapp,auth_user_id").eq("id", personId).maybeSingle();
  const { data: cs } = await d.from("cases").select("id").eq("person_id", personId);
  const ids = (cs ?? []).map((c) => c.id as string);
  const [{ data: docs }, messages] = await Promise.all([
    d.from("case_documents").select("id,title,status,file_path,file_name,uploaded_by,review_note,received,size_bytes").or(ids.length ? `person_id.eq.${personId},case_id.in.(${ids.join(",")})` : `person_id.eq.${personId}`).order("title"),
    readMessages(d, personId),
  ]);
  if (messages.some((m) => m.sender === "client")) await d.from("client_messages").update({ read_by_staff_at: new Date().toISOString() }).eq("person_id", personId).eq("sender", "client").is("read_by_staff_at", null);
  const list = docs ?? [];
  const ready = list.filter((x) => x.status === "approved").length;

  return (
    <>
      <Card title={`Documents (${ready} of ${list.length} approved)`}>
        {list.length ? list.map((x) => (
          <div key={x.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ overflowWrap: "anywhere" }}><b>{x.title}</b>{x.file_name ? <><br /><span style={{ color: "var(--muted)", fontSize: 13 }}>{x.file_name}</span></> : null}</span>
              <Badge color={STATUS_COLOUR[x.status]}>{STATUS_LABEL[x.status] ?? x.status}</Badge>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {x.file_path && <a className="btn btn-outline" style={{ minHeight: 44 }} href={`/admin/docs/${x.id}`}>Open file</a>}
              {x.file_path && x.status !== "approved" && <form action={reviewDoc}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="path" value={path} /><button className="btn btn-dark" style={{ minHeight: 44 }}>Approve</button></form>}
              {!x.file_path && <form action={toggleCaseDoc}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="path" value={path} /><input type="hidden" name="received" value={x.received ? "0" : "1"} /><button className="btn btn-outline" style={{ minHeight: 44 }}>{x.received ? "Undo" : "Got the paper copy"}</button></form>}
              {!x.file_path && <DocUpload base="/api/admin" docId={x.id} text={{ ...UP, choose: "Add file" }} variant="outline" />}
            </div>
            {x.status !== "approved" && x.file_path && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: "pointer", minHeight: 40, display: "flex", alignItems: "center", fontSize: 15 }}>Ask the client to send it again</summary>
                <form action={reviewDoc} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input type="hidden" name="id" value={x.id} /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="path" value={path} />
                  <input name="note" className="field" required maxLength={500} placeholder="What is wrong? e.g. the photo is blurred" aria-label="Reason" style={{ flex: 1, minWidth: 200 }} />
                  <button className="btn btn-outline" style={{ minHeight: 44 }}>Send back</button>
                </form>
              </details>
            )}
          </div>
        )) : <Empty text="No documents yet. Ask for one below." />}
        <form action={requestDoc} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input type="hidden" name="person_id" value={personId} /><input type="hidden" name="case_id" value={caseId ?? ""} /><input type="hidden" name="path" value={path} />
          <input name="title" className="field" required minLength={2} maxLength={120} placeholder="Ask for a document, e.g. bank statement" aria-label="Document to ask for" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn btn-primary" style={{ minHeight: 44 }}>Ask client</button>
        </form>
      </Card>

      <Card title={`Chat with ${person?.full_name ?? "client"}`}>
        {!person?.auth_user_id && <p style={{ margin: "0 0 10px", color: "var(--amber-text)", fontSize: 15 }}>This client has no login yet, so they will not see messages until you send them a link below.</p>}
        <ChatThread endpoint="/api/admin/messages" query={`person=${personId}`} me="staff" initial={messages} text={CHAT} height={320} />
      </Card>

      <Card title="Client login">
        <PortalAccess personId={personId} name={person?.full_name ?? ""} whatsapp={person?.whatsapp ?? null} hasLogin={Boolean(person?.auth_user_id)} />
      </Card>
    </>
  );
}
