export type CatalogVerificationRecord = {
  modelCode: string;
  pdfSourceReference: "Carrier-Midea-Price-List-2026-06-07.pdf";
  officialSourceUrl: string | null;
  verificationStatus: "pdf-verified" | "client-confirmation-required";
  clientApprovalStatus: "approved" | "pending";
  internalVerificationNotes?: string;
};

import { productVariants } from "@/content/product-variants";

export const catalogSourceManifest: CatalogVerificationRecord[] = productVariants.map((variant) => variant.modelCode === "53QHABT30DN-708F" ? {
  modelCode: variant.modelCode,
  pdfSourceReference: "Carrier-Midea-Price-List-2026-06-07.pdf",
  officialSourceUrl: null,
  verificationStatus: "client-confirmation-required",
  clientApprovalStatus: "pending",
  internalVerificationNotes: "Preserved exactly from the client PDF; final client confirmation required.",
} : {
  modelCode: variant.modelCode,
  pdfSourceReference: "Carrier-Midea-Price-List-2026-06-07.pdf",
  officialSourceUrl: null,
  verificationStatus: "pdf-verified",
  clientApprovalStatus: "approved",
});

export const catalogInternalNotes = {
  xtremeProPdfSpelling: "The client PDF spells the public family name as Xtream Pro; approved UI spelling is XTreme Pro.",
} as const;

export const catalogCapacityVerification = {
  capacityCodeMapping: { 12: 1.5, 18: 2.25, 24: 3, 30: 4, 36: 5, 48: 6, 60: 7.5 },
  implementationDate: "2026-07-14",
  mappingApprovalStatus: "approved",
  source: "Client-approved capacity-code mapping",
  pendingModelVerification: {
    modelCode: "53QHABT30DN-708F",
    status: "client-confirmation-required",
    note: "The model-code verification remains pending; its approved capacity code 30 maps to 4 HP.",
  },
} as const;
