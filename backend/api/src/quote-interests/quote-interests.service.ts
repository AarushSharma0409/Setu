import { Injectable, Logger } from "@nestjs/common";

import { EnvService } from "../common/env/env.service";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class QuoteInterestsService {
  private readonly logger = new Logger(QuoteInterestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly mail: MailService,
  ) {}

  async create(service: string) {
    const safeService = service.replace(/[\r\n]/g, " ").trim();
    const interest = await this.prisma.quoteInterest.create({
      data: { service: safeService },
    });

    const delivery = await this.notifyAdmin(interest.id, safeService);
    return {
      id: interest.id,
      status: "RECEIVED" as const,
      emailNotification: delivery,
    };
  }

  private async notifyAdmin(id: string, service: string) {
    if (!this.env.values.ADMIN_QUOTE_NOTIFICATION_EMAIL) {
      return "NOT_CONFIGURED" as const;
    }

    try {
      const sent = await this.mail.send({
        event: "quote_interest_admin_notification",
        to: this.env.values.ADMIN_QUOTE_NOTIFICATION_EMAIL,
        subject: `New Setu quotation interest: ${service}`,
        title: "New finance quotation interest",
        body: `A visitor asked for the best quotation from the Setu Finance product basket.\n\nService: ${service}\nRequest ID: ${id}\n\nThe request was recorded in Setu.`,
        cta: { label: "Open admin", url: this.mail.adminUrl("/dashboard") },
      });
      if (!sent) throw new Error("SMTP delivery failed or is disabled");

      await this.prisma.quoteInterest.update({
        where: { id },
        data: { emailSentAt: new Date() },
      });
      return "SENT" as const;
    } catch {
      await this.prisma.quoteInterest.update({
        where: { id },
        data: {
          emailDeliveryError: "Delivery failed; retry from the admin workflow.",
        },
      });
      this.logger.error(
        `Quote-interest email delivery failed for request ${id}`,
      );
      return "FAILED" as const;
    }
  }
}
