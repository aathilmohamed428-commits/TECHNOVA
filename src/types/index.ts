export type InspectionStatus = 'DRAFT' | 'ANALYZING' | 'REVIEW_REQUIRED' | 'COMPLIANT' | 'NON_COMPLIANT' | 'INSUFFICIENT_EVIDENCE';

export type UserRole = 'INSPECTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  jurisdiction: string;
}

export type DeclarationType =
  | 'MRP'
  | 'NET_QUANTITY'
  | 'UNIT_SALE_PRICE'
  | 'MANUFACTURER_NAME'
  | 'MANUFACTURER_ADDRESS'
  | 'PACKER_NAME_ADDRESS'
  | 'IMPORTER_NAME_ADDRESS'
  | 'MFG_PACKING_DATE'
  | 'BEST_BEFORE_EXPIRY'
  | 'CONSUMER_CARE'
  | 'COUNTRY_OF_ORIGIN'
  | 'PRODUCT_NAME'
  | 'GENERIC_NAME'
  | 'BARCODE_FSSAI';

export type DeclarationStatus = 'DETECTED' | 'NOT_DETECTED' | 'UNCERTAIN' | 'NOT_APPLICABLE' | 'REVIEW_REQUIRED';

export interface BoundingBox {
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  w: number; // percentage 0..100
  h: number; // percentage 0..100
}

export interface ExtractedDeclaration {
  id: string;
  type: DeclarationType;
  label: string;
  rawValue: string;
  normalizedValue: string;
  status: DeclarationStatus;
  confidence: number; // 0..100
  imageId: string;
  boundingBox?: BoundingBox;
  notes?: string;
}

export interface ImageQualityMetrics {
  sharpness: number; // 0..100
  brightness: number; // 0..100
  contrast: number; // 0..100
  glareDetected: boolean;
  stabilityScore: number; // 0..100
  acceptable: boolean;
}

export interface CapturedEvidenceImage {
  id: string;
  inspectionId: string;
  viewName: 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'TOP' | 'BOTTOM' | 'LABEL_ZOOM';
  dataUrl: string;
  timestamp: string;
  quality: ImageQualityMetrics;
  hash: string;
}

export interface LegalRule {
  id: string;
  ruleCode: string; // e.g., LM-PC-006(1)(a)
  version: string; // e.g. "2026.1"
  category: 'DECLARATION_PRESENCE' | 'FORMAT_STANDARDS' | 'MRP_PRICE_DISPLAY' | 'QUANTITY_DECLARATION' | 'MANUFACTURER_CONTACT' | 'DATE_FORMAT';
  title: string;
  description: string;
  mandatoryFields: DeclarationType[];
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  legalActReference: string; // e.g., "Rule 6(1) Legal Metrology (Packaged Commodities) Rules, 2011"
}

export type ComplianceRuleResult = 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  version: string;
  ruleTitle: string;
  result: ComplianceRuleResult;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  findings: string;
  confidence: number;
  imageId?: string;
  boundingBox?: BoundingBox;
  observedText?: string;
  requiredFormat?: string;
}

export type InspectorDecisionType = 'CONFIRM_VIOLATION' | 'REJECT_FINDING' | 'REQUEST_MORE_EVIDENCE' | 'MARK_COMPLIANT';

export interface InspectorDecision {
  ruleId: string;
  decision: InspectorDecisionType;
  inspectorId: string;
  timestamp: string;
  remarks: string;
}

export interface InspectionRecord {
  id: string;
  inspectionNumber: string; // LMX-2026-XXXXXX
  timestamp: string;
  inspectorId: string;
  inspectorName: string;
  location: string;
  productName: string;
  brand: string;
  manufacturer: string;
  barcode?: string;
  category: string;
  status: InspectionStatus;
  overallScore: number; // 0..100
  images: CapturedEvidenceImage[];
  declarations: ExtractedDeclaration[];
  evaluations: RuleEvaluationResult[];
  decisions: InspectorDecision[];
  evidenceIntegrityHash: string;
  digitalMarketplaceMismatch?: {
    flagged: boolean;
    physicalPrice?: string;
    onlinePrice?: string;
    sourceUrl?: string;
  };
  visualAnomalyDetected?: boolean;
  notes?: string;
}

export interface ProductIdentity {
  id: string;
  productId: string; // PRD-XXXXXX
  brand: string;
  productName: string;
  manufacturer: string;
  category: string;
  barcode?: string;
  lastInspectedAt: string;
  totalInspections: number;
  complianceRate: number; // 0..100
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  registeredMrp?: string;
}

export interface ComplaintRecord {
  id: string;
  complaintNumber: string;
  productName: string;
  brand: string;
  manufacturer: string;
  category: string;
  issueDescription: string;
  reporter: string;
  reporterContact: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
  createdAt: string;
  evidenceImageDataUrl?: string;
}
