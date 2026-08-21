import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

import { EnvService } from "../common/env/env.service";

interface MailContent {
  event: string;
  to: string | null | undefined;
  subject: string;
  title: string;
  body: string;
  cta?: { label: string; url: string };
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly env: EnvService) {}

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log("Transactional mail is disabled or not configured");
      return;
    }
    this.transporter = nodemailer.createTransport({
      host: this.env.values.SMTP_HOST,
      port: this.env.values.SMTP_PORT,
      secure: this.env.values.SMTP_SECURE,
      auth: {
        user: this.env.values.SMTP_USER,
        pass: this.env.values.SMTP_PASSWORD,
      },
      connectionTimeout: this.env.values.SMTP_CONNECTION_TIMEOUT_MS,
      greetingTimeout: this.env.values.SMTP_GREETING_TIMEOUT_MS,
      socketTimeout: this.env.values.SMTP_SOCKET_TIMEOUT_MS,
    });
    try {
      await this.transporter.verify();
      this.logger.log("Transactional SMTP transport is available");
    } catch (error) {
      this.logger.warn(
        `Transactional SMTP verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  isConfigured(): boolean {
    const values = this.env.values;
    return Boolean(
      values.MAIL_ENABLED &&
        values.SMTP_HOST &&
        values.SMTP_USER &&
        values.SMTP_PASSWORD &&
        values.MAIL_FROM_ADDRESS,
    );
  }

  publicUrl(path: string): string {
    return new URL(path, this.env.values.PUBLIC_SITE_URL ?? this.env.values.PUBLIC_WEB_URL ?? "http://localhost:3000").toString();
  }

  adminUrl(path: string): string {
    return new URL(path, this.env.values.ADMIN_SITE_URL ?? "http://localhost:3001").toString();
  }

  async send(content: MailContent): Promise<boolean> {
    if (!content.to || !this.isConfigured()) {
      this.log(content.event, content.to, "skipped");
      return false;
    }
    if (!this.transporter) await this.onModuleInit();
    if (!this.transporter) return false;
    try {
      await this.transporter.sendMail({
        from: this.env.values.MAIL_FROM_ADDRESS,
        to: content.to,
        subject: content.subject,
        text: renderText(content),
        html: renderHtml(content),
      });
      this.log(content.event, content.to, "sent");
      return true;
    } catch (error) {
      this.logger.error(
        `Transactional email failed event=${content.event} recipient=${maskEmail(content.to)} error=${error instanceof Error ? error.message : "unknown"}`,
      );
      return false;
    }
  }

  private log(event: string, recipient: string | null | undefined, status: string) {
    this.logger.log(`Transactional email ${status} event=${event} recipient=${maskEmail(recipient)}`);
  }
}

function renderText(content: MailContent): string {
  return [
    "SETU",
    "",
    content.title,
    "",
    content.body,
    content.cta ? `\n${content.cta.label}: ${content.cta.url}` : "",
    "\nSetu",
  ].join("\n");
}

function renderHtml(content: MailContent): string {
  const cta = content.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(content.cta.url)}" style="display:inline-block;background:#6d28d9;border-radius:8px;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(content.cta.label)}</a></p>`
    : "";
  return `<div style="background:#f5f7fb;padding:28px 12px;font-family:Arial,sans-serif;color:#172033"><main style="background:#ffffff;border-radius:12px;margin:auto;max-width:560px;padding:32px"><p style="color:#6d28d9;font-size:14px;font-weight:800;letter-spacing:1px;margin:0">SETU</p><h1 style="font-size:24px;line-height:1.25;margin:18px 0 12px">${escapeHtml(content.title)}</h1><p style="color:#475569;font-size:16px;line-height:1.65;margin:0;white-space:pre-line">${escapeHtml(content.body)}</p>${cta}<p style="border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;margin:26px 0 0;padding-top:18px">This is a transactional notification from Setu.</p></main></div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function maskEmail(value: string | null | undefined): string {
  if (!value) return "none";
  const [local, domain] = value.split("@");
  return local && domain ? `${local.slice(0, 1)}***@${domain}` : "invalid";
}
