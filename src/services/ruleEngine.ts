import { LegalRule, ExtractedDeclaration, RuleEvaluationResult } from '../types';

export const OFFICIAL_RULES_2026: LegalRule[] = [
  {
    id: 'rule-mrp-01',
    ruleCode: 'LM-PC-006(1)(e)',
    version: '2026.1',
    category: 'MRP_PRICE_DISPLAY',
    title: 'Maximum Retail Price (MRP) Declaration',
    description: 'MRP must be clearly stated as "Maximum Retail Price ₹..." or "MRP ₹... (inclusive of all taxes)".',
    mandatoryFields: ['MRP'],
    severity: 'CRITICAL',
    legalActReference: 'Rule 6(1)(e) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-netqty-02',
    ruleCode: 'LM-PC-006(1)(c)',
    version: '2026.1',
    category: 'QUANTITY_DECLARATION',
    title: 'Net Quantity Declaration & Standard Unit',
    description: 'Net quantity must be declared in terms of standard unit of weight (g, kg), volume (ml, l), or number (N/pcs).',
    mandatoryFields: ['NET_QUANTITY'],
    severity: 'CRITICAL',
    legalActReference: 'Rule 6(1)(c) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-mfg-03',
    ruleCode: 'LM-PC-006(1)(a)',
    version: '2026.1',
    category: 'MANUFACTURER_CONTACT',
    title: 'Name and Complete Address of Manufacturer/Packer',
    description: 'The package must bear complete name and address of the manufacturer, packer or importer.',
    mandatoryFields: ['MANUFACTURER_NAME'],
    severity: 'CRITICAL',
    legalActReference: 'Rule 6(1)(a) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-date-04',
    ruleCode: 'LM-PC-006(1)(d)',
    version: '2026.1',
    category: 'DATE_FORMAT',
    title: 'Month and Year of Manufacture / Packing',
    description: 'Month and year of manufacture or packing must be declared clearly (e.g. MM/YYYY or Month YYYY).',
    mandatoryFields: ['MFG_PACKING_DATE'],
    severity: 'MAJOR',
    legalActReference: 'Rule 6(1)(d) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-care-05',
    ruleCode: 'LM-PC-006(1)(n)',
    version: '2026.1',
    category: 'MANUFACTURER_CONTACT',
    title: 'Consumer Care Cell Details',
    description: 'Name, address, telephone number, and email address of the person/office to be contacted in case of consumer complaints.',
    mandatoryFields: ['CONSUMER_CARE'],
    severity: 'CRITICAL',
    legalActReference: 'Rule 6(1)(n) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-usp-06',
    ruleCode: 'LM-PC-006(1)(ea)',
    version: '2026.1',
    category: 'MRP_PRICE_DISPLAY',
    title: 'Unit Sale Price Declaration',
    description: 'Unit sale price (e.g., ₹/g, ₹/ml, ₹/N) must be declared whenever net quantity is greater than 1g/1ml/1N.',
    mandatoryFields: ['UNIT_SALE_PRICE'],
    severity: 'MAJOR',
    legalActReference: 'Rule 6(1)(ea) Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  {
    id: 'rule-origin-07',
    ruleCode: 'LM-PC-006(1)(o)',
    version: '2026.1',
    category: 'DECLARATION_PRESENCE',
    title: 'Country of Origin Declaration',
    description: 'For imported packages, the country of origin must be stated prominently.',
    mandatoryFields: ['COUNTRY_OF_ORIGIN'],
    severity: 'MAJOR',
    legalActReference: 'Rule 6(1)(o) Legal Metrology (Packaged Commodities) Rules, 2011'
  }
];

export class LegalRuleEngine {
  public static evaluateDeclarations(declarations: ExtractedDeclaration[]): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];
    const declMap = new Map<string, ExtractedDeclaration>();
    declarations.forEach(d => declMap.set(d.type, d));

    for (const rule of OFFICIAL_RULES_2026) {
      let pass = true;
      let review = false;
      let findings = '';
      let observedText = '';
      let targetDecl: ExtractedDeclaration | undefined;

      for (const field of rule.mandatoryFields) {
        targetDecl = declMap.get(field);
        if (!targetDecl || targetDecl.status === 'NOT_DETECTED') {
          pass = false;
          findings = `Mandatory declaration ${field} was not detected on any captured surface.`;
          break;
        } else if (targetDecl.status === 'REVIEW_REQUIRED' || targetDecl.status === 'UNCERTAIN') {
          review = true;
          observedText = targetDecl.rawValue;
          findings = `Declaration detected (${targetDecl.rawValue}), but format or clarity requires inspector review.`;
        } else {
          observedText = targetDecl.rawValue;
        }
      }

      // Specific validation checks
      if (rule.ruleCode === 'LM-PC-006(1)(e)' && targetDecl) {
        // Check MRP format (e.g. ₹ or Rs. with numbers)
        const val = targetDecl.rawValue.toUpperCase();
        if (!val.includes('₹') && !val.includes('RS') && !val.includes('MRP')) {
          pass = false;
          findings = `MRP text "${targetDecl.rawValue}" lacks legal prefix symbol '₹' or 'MRP'.`;
        } else if (!/\d+/.test(val)) {
          pass = false;
          findings = `MRP declaration contains no numeric price value.`;
        } else if (!val.includes('INCL') && !val.includes('TAX') && !val.includes('ALL')) {
          review = true;
          findings = `MRP value found ("${targetDecl.rawValue}"), but mandatory phrase "inclusive of all taxes" could not be verified with high confidence.`;
        }
      }

      if (rule.ruleCode === 'LM-PC-006(1)(c)' && targetDecl) {
        // Net Qty validation (check for g, kg, ml, l, N, pcs)
        const val = targetDecl.rawValue.toLowerCase();
        const hasUnit = /(g|kg|ml|l|liter|litre|n|net|gm|grams|pcs)/i.test(val);
        if (!hasUnit) {
          pass = false;
          findings = `Net Quantity "${targetDecl.rawValue}" does not specify a legal standard unit (g, kg, ml, l, N).`;
        }
      }

      if (rule.ruleCode === 'LM-PC-006(1)(n)' && targetDecl) {
        const val = targetDecl.rawValue.toLowerCase();
        const hasContact = /(phone|tel|email|care|consumer|contact|customer|call)/i.test(val) || /[\w.-]+@[\w.-]+\.\w+/.test(val) || /\d{10}/.test(val);
        if (!hasContact) {
          review = true;
          findings = `Consumer care section detected ("${targetDecl.rawValue}"), but specific toll-free number or email address requires verification.`;
        }
      }

      let res: ComplianceRuleResult = 'PASS';
      if (!pass) res = 'FAIL';
      else if (review) res = 'REVIEW';

      results.push({
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        version: rule.version,
        ruleTitle: rule.title,
        result: res,
        severity: rule.severity,
        findings: findings || `Compliant with ${rule.legalActReference}.`,
        confidence: targetDecl ? targetDecl.confidence : 0,
        imageId: targetDecl?.imageId,
        boundingBox: targetDecl?.boundingBox,
        observedText: observedText || 'N/A',
        requiredFormat: rule.description
      });
    }

    return results;
  }
}
