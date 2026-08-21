import { ConflictException } from "@nestjs/common";
import { InquiryStatus } from "@prisma/client";

const transitions: Record<InquiryStatus, readonly InquiryStatus[]> = {
  [InquiryStatus.NEW]: [
    InquiryStatus.VIEWED,
    InquiryStatus.CONTACTED,
    InquiryStatus.CLOSED,
    InquiryStatus.WITHDRAWN,
  ],
  [InquiryStatus.VIEWED]: [
    InquiryStatus.CONTACTED,
    InquiryStatus.IN_PROGRESS,
    InquiryStatus.CLOSED,
    InquiryStatus.WITHDRAWN,
  ],
  [InquiryStatus.CONTACTED]: [
    InquiryStatus.IN_PROGRESS,
    InquiryStatus.RESOLVED,
    InquiryStatus.CLOSED,
    InquiryStatus.WITHDRAWN,
  ],
  [InquiryStatus.IN_PROGRESS]: [
    InquiryStatus.RESOLVED,
    InquiryStatus.CLOSED,
    InquiryStatus.WITHDRAWN,
  ],
  [InquiryStatus.RESOLVED]: [InquiryStatus.CLOSED],
  [InquiryStatus.CLOSED]: [],
  [InquiryStatus.WITHDRAWN]: [],
};

export function assertTransition(from: InquiryStatus, to: InquiryStatus) {
  if (!transitions[from].includes(to)) {
    throw new ConflictException(
      `Cannot transition inquiry from ${from} to ${to}`,
    );
  }
}

export function canUserWithdraw(status: InquiryStatus): boolean {
  const withdrawable: InquiryStatus[] = [
    InquiryStatus.NEW,
    InquiryStatus.VIEWED,
    InquiryStatus.CONTACTED,
    InquiryStatus.IN_PROGRESS,
  ];
  return withdrawable.includes(status);
}

export function canUserClose(status: InquiryStatus): boolean {
  return status === InquiryStatus.RESOLVED;
}

export function isTerminal(status: InquiryStatus): boolean {
  return status === InquiryStatus.CLOSED || status === InquiryStatus.WITHDRAWN;
}
