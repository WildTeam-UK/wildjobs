import type { Metadata } from "next";
import Link from "next/link";

import { SubmissionInviteForm } from "@/components/admin/submission-invite-form";
import { formatSubmissionTimestamp } from "@/lib/admin/employer-submission-display";
import { getSubmissionInvitationWorkspace } from "@/lib/admin/employer-submissions";

export const metadata: Metadata = { title: "Employer invitations" };

function invitationStatus(invitation: {
  expires_at: string;
  revoked_at: string | null;
  used_at: string | null;
}) {
  if (invitation.used_at) return "Used";
  if (invitation.revoked_at) return "Revoked";
  if (new Date(invitation.expires_at).getTime() <= Date.now()) return "Expired";
  return "Active";
}

export default async function EmployerInvitationsPage() {
  const { employers, invitations } = await getSubmissionInvitationWorkspace();

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/submissions">
          <span aria-hidden="true">←</span> Submission queue
        </Link>
      </div>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Controlled employer intake</p>
          <h1>Submission invitations</h1>
        </div>
        <p>Create one short-lived route for an employer without opening WildJobs to public submissions.</p>
      </header>

      <section className="staff-section shell">
        <SubmissionInviteForm employers={employers} />
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Invitation history</p>
            <h2>{invitations.length} recent invitations</h2>
          </div>
          <p>Plain tokens cannot be retrieved after creation.</p>
        </div>
        {invitations.length ? (
          <div className="submission-invitation-list">
            {invitations.map((invitation) => (
              <article key={invitation.id}>
                <div>
                  <span className="status-badge">{invitationStatus(invitation)}</span>
                  <p>INV-{invitation.id}</p>
                </div>
                <div>
                  <h3>{invitation.invitee_email}</h3>
                  <p>{invitation.employers?.name ?? "Employer not matched"}</p>
                </div>
                <dl>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatSubmissionTimestamp(invitation.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{formatSubmissionTimestamp(invitation.expires_at)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">No invitations yet</p>
            <h2>Create one when an employer is ready to submit.</h2>
            <p>The secure link will be displayed once for you to copy.</p>
          </div>
        )}
      </section>
    </main>
  );
}
