export interface STRAPLevel {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  clearanceRequired: string;
  accessRequirements: string[];
  handlingInstructions: string[];
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export interface ClassificationMarking {
  baseClassification: 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  strapLevel?: STRAPLevel;
  caveats: string[];
  releasability: string[];
  declassificationDate?: Date;
  originatorReference: string;
  handlingInstructions: string[];
}

export interface ClassifiedDocument {
  id: string;
  filename: string;
  classification: ClassificationMarking;
  createdAt: Date;
  lastModified: Date;
  accessLog: AccessLogEntry[];
  redactionLevel: 'NONE' | 'PARTIAL' | 'HEAVY' | 'COMPLETE';
}

export interface AccessLogEntry {
  userId: string;
  timestamp: Date;
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'PRINT' | 'SHARE';
  ipAddress: string;
  userAgent: string;
  clearanceLevel: string;
}

export const STRAP_LEVELS: Record<number, STRAPLevel> = {
  1: {
    level: 1,
    name: 'STRAP 1',
    description: 'High sensitivity - Risk to lives or operations',
    clearanceRequired: 'SC (Security Cleared) + Need-to-Know',
    accessRequirements: [
      'Security Clearance (SC) minimum',
      'Specific STRAP 1 briefing completed',
      'Need-to-know basis authorization',
      'Secure facility access required'
    ],
    handlingInstructions: [
      'Store in approved security container',
      'Access only in SCIF or equivalent',
      'No electronic transmission without encryption',
      'Destroy using approved methods only'
    ],
    backgroundColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400'
  },
  2: {
    level: 2,
    name: 'STRAP 2',
    description: 'Very high sensitivity - Risk to national security',
    clearanceRequired: 'DV (Developed Vetting) + Specific STRAP 2 access',
    accessRequirements: [
      'Developed Vetting (DV) clearance mandatory',
      'STRAP 2 specific authorization',
      'Compartmented access approval',
      'Enhanced background verification'
    ],
    handlingInstructions: [
      'Store in Type 6 security container minimum',
      'Access restricted to designated SCIF only',
      'No copying without specific authorization',
      'Witness required for destruction'
    ],
    backgroundColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-500'
  },
  3: {
    level: 3,
    name: 'STRAP 3',
    description: 'Extreme sensitivity - Catastrophic harm potential',
    clearanceRequired: 'Special STRAP 3 clearance + Enhanced vetting',
    accessRequirements: [
      'STRAP 3 specific clearance (beyond DV)',
      'Enhanced psychological evaluation',
      'Continuous monitoring authorization',
      'Special access program nomination'
    ],
    handlingInstructions: [
      'Store in Type 7 security container only',
      'Access in designated STRAP 3 facility only',
      'No reproduction under any circumstances',
      'Dual-person integrity required',
      'Immediate reporting of any compromise'
    ],
    backgroundColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-600'
  }
};