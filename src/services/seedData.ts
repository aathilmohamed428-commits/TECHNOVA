import { db } from '../db/database';
import { OFFICIAL_RULES_2026 } from './ruleEngine';
import { InspectionRecord, ProductIdentity, ComplaintRecord, User } from '../types';

export const DEFAULT_INSPECTOR: User = {
  id: 'usr-01',
  name: 'Inspector R. K. Sharma',
  badgeNumber: 'LM-DEL-8842',
  role: 'INSPECTOR',
  jurisdiction: 'New Delhi North Zone'
};

export async function initializeSeedDataIfEmpty() {
  const count = await db.inspections.count();
  if (count > 0) return;

  // 1. Seed Rules
  await db.rules.bulkPut(OFFICIAL_RULES_2026);

  // 2. Seed User
  await db.users.put(DEFAULT_INSPECTOR);

  // 3. Seed Products
  const seedProducts: ProductIdentity[] = [
    {
      id: 'prd-01',
      productId: 'PRD-100234',
      brand: 'Crispy Crunch',
      productName: 'Potato Chips Masala Flavor 100g',
      manufacturer: 'Crispy Foods Pvt Ltd, Industrial Area, Baddi (H.P.)',
      category: 'Packaged Snacks',
      barcode: '8901234567890',
      lastInspectedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      totalInspections: 3,
      complianceRate: 66,
      riskScore: 'MEDIUM',
      registeredMrp: '₹35.00'
    },
    {
      id: 'prd-02',
      productId: 'PRD-100589',
      brand: 'Pure Gold',
      productName: 'Refined Sunflower Oil 1 Litre',
      manufacturer: 'Pure Oils Ltd, Kandla Port, Gujarat',
      category: 'Edible Oils',
      barcode: '8909876543210',
      lastInspectedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      totalInspections: 5,
      complianceRate: 100,
      riskScore: 'LOW',
      registeredMrp: '₹165.00'
    },
    {
      id: 'prd-03',
      productId: 'PRD-100812',
      brand: 'NutriBake',
      productName: 'Digestive Oats Biscuits 200g',
      manufacturer: 'Nutri Foods Ltd, Bengaluru, Karnataka',
      category: 'Bakery',
      barcode: '8905554443332',
      lastInspectedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      totalInspections: 2,
      complianceRate: 50,
      riskScore: 'HIGH',
      registeredMrp: '₹60.00'
    }
  ];

  await db.products.bulkPut(seedProducts);

  // 4. Seed Past Inspection Record
  const sampleInspection: InspectionRecord = {
    id: 'insp-seed-01',
    inspectionNumber: 'LMX-2026-000189',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    inspectorId: DEFAULT_INSPECTOR.id,
    inspectorName: DEFAULT_INSPECTOR.name,
    location: 'Metro Supermarket, Connaught Place, New Delhi',
    productName: 'Potato Chips Masala Flavor 100g',
    brand: 'Crispy Crunch',
    manufacturer: 'Crispy Foods Pvt Ltd, Baddi (H.P.)',
    barcode: '8901234567890',
    category: 'Packaged Snacks',
    status: 'NON_COMPLIANT',
    overallScore: 68,
    images: [
      {
        id: 'img-seed-1',
        inspectionId: 'insp-seed-01',
        viewName: 'FRONT',
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="40%" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a" text-anchor="middle">CRISPY CRUNCH CHIPS</text><text x="50%" y="55%" font-family="sans-serif" font-size="16" fill="%230284c7" text-anchor="middle">Net Wt: 100g | MRP: ₹35 (Incl Taxes)</text><rect x="50" y="200" width="300" height="60" fill="%23e2e8f0" rx="4"/><text x="60" y="235" font-family="sans-serif" font-size="12" fill="%23334155">Mfg: 01/2026 | Baddi H.P.</text></svg>',
        timestamp: new Date().toISOString(),
        quality: { sharpness: 90, brightness: 80, contrast: 85, glareDetected: false, stabilityScore: 95, acceptable: true },
        hash: 'a1b2c3d4e5f67890'
      }
    ],
    declarations: [
      {
        id: 'dec-1',
        type: 'MRP',
        label: 'Maximum Retail Price (MRP)',
        rawValue: 'MRP ₹35 (INCL. TAXES)',
        normalizedValue: '₹35.00',
        status: 'DETECTED',
        confidence: 94,
        imageId: 'img-seed-1',
        boundingBox: { x: 20, y: 45, w: 60, h: 10 }
      },
      {
        id: 'dec-2',
        type: 'NET_QUANTITY',
        label: 'Net Quantity',
        rawValue: 'Net Wt: 100g',
        normalizedValue: '100g',
        status: 'DETECTED',
        confidence: 91,
        imageId: 'img-seed-1',
        boundingBox: { x: 20, y: 50, w: 40, h: 10 }
      },
      {
        id: 'dec-3',
        type: 'CONSUMER_CARE',
        label: 'Consumer Care Cell Details',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId: 'img-seed-1'
      }
    ],
    evaluations: [
      {
        ruleId: 'rule-mrp-01',
        ruleCode: 'LM-PC-006(1)(e)',
        version: '2026.1',
        ruleTitle: 'Maximum Retail Price (MRP) Declaration',
        result: 'PASS',
        severity: 'CRITICAL',
        findings: 'MRP clearly stated with legal symbol ₹ and inclusive of all taxes.',
        confidence: 94,
        observedText: 'MRP ₹35 (INCL. TAXES)'
      },
      {
        ruleId: 'rule-care-05',
        ruleCode: 'LM-PC-006(1)(n)',
        version: '2026.1',
        ruleTitle: 'Consumer Care Cell Details',
        result: 'FAIL',
        severity: 'CRITICAL',
        findings: 'Mandatory consumer complaint telephone / email address missing on package label.',
        confidence: 0,
        observedText: 'NOT FOUND'
      }
    ],
    decisions: [
      {
        ruleId: 'rule-care-05',
        decision: 'CONFIRM_VIOLATION',
        inspectorId: DEFAULT_INSPECTOR.id,
        timestamp: new Date().toISOString(),
        remarks: 'Violation confirmed during physical inspection at Connaught Place store.'
      }
    ],
    evidenceIntegrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    digitalMarketplaceMismatch: {
      flagged: true,
      physicalPrice: '₹35.00',
      onlinePrice: '₹42.00',
      sourceUrl: 'https://e-commerce.example.com/item/100234'
    }
  };

  await db.inspections.put(sampleInspection);

  // 5. Seed Complaints
  const sampleComplaints: ComplaintRecord[] = [
    {
      id: 'cmp-01',
      complaintNumber: 'CMP-2026-9012',
      productName: 'NutriBake Oats Biscuits',
      brand: 'NutriBake',
      manufacturer: 'Nutri Foods Ltd',
      category: 'Bakery',
      issueDescription: 'MRP sticker pasted over original lower price printed on box.',
      reporter: 'Anil Kumar (Consumer)',
      reporterContact: '+91 9876543210',
      status: 'VERIFIED',
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
    }
  ];

  await db.complaints.bulkPut(sampleComplaints);
}
