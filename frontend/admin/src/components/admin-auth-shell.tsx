import React, { type ReactNode } from "react";

export function AdminAuthShell({
  children,
  description,
  eyebrow,
  step,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  step: string;
  title: string;
}) {
  return (
    <main className="setu-admin-auth-page">
      <div className="setu-admin-auth-shell">
        <aside className="setu-admin-auth-aside">
          <div className="setu-admin-auth-brand">
            <span aria-hidden="true" className="setu-admin-auth-mark">
              S
            </span>
            <span>Setu Operations</span>
          </div>
          <div className="setu-admin-auth-aside-copy">
            <p className="setu-admin-auth-kicker">Internal workspace</p>
            <h2>Built for careful decisions.</h2>
            <p>
              Review, verify, and operate the platform from one protected
              workspace.
            </p>
          </div>
          <ul className="setu-admin-auth-signals">
            <li>
              <span aria-hidden="true">01</span>
              <div>
                <strong>Private access</strong>
                <small>Separate admin authentication boundary</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <div>
                <strong>Verified sessions</strong>
                <small>Multi-factor verification protects every session</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <div>
                <strong>Traceable actions</strong>
                <small>Important operational actions are audited</small>
              </div>
            </li>
          </ul>
        </aside>
        <section className="setu-admin-auth-content">
          <div className="setu-admin-auth-meta">
            <span>{eyebrow}</span>
            <span>{step}</span>
          </div>
          <h1>{title}</h1>
          <p className="setu-admin-auth-description">{description}</p>
          <div className="setu-admin-auth-card">{children}</div>
        </section>
      </div>
    </main>
  );
}
