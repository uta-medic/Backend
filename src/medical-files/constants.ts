export const FILE_TYPES = ['PDF', 'DICOM', 'IMAGE'] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const AUDIT_ACTIONS = ['UPLOAD', 'VIEW', 'DOWNLOAD', 'DELETE'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];