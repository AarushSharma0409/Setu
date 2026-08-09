# Insurance data classification and document handling

Sprint I1 stores organization regulatory metadata only. It deliberately does
not collect customer insurance, medical, vehicle, financial, KYC, or policy
data.

Insurance organization documents use their own model and UUID-based private
storage keys. They do not use marketplace `VendorDocument` records. Uploaded
files are size-, MIME-, extension-, and binary-signature-validated, with a
malware-scanning integration boundary. Raw document content and storage keys
are not exposed in list or detail DTOs.

Authorized administrators receive a short-lived signed read URL through a
permission-checked endpoint. Document access is audited without recording a
signed URL. The local storage adapter is development-only; production requires
a private S3-compatible adapter and malware scanning before the feature is
enabled.
