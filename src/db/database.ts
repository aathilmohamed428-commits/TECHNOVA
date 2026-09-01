import Dexie, { Table } from 'dexie';
import { InspectionRecord, ProductIdentity, ComplaintRecord, LegalRule, User } from '../types';

export class LegalMetrixDB extends Dexie {
  inspections!: Table<InspectionRecord>;
  products!: Table<ProductIdentity>;
  complaints!: Table<ComplaintRecord>;
  rules!: Table<LegalRule>;
  users!: Table<User>;

  constructor() {
    super('LegalMetrixDB');
    this.version(1).stores({
      inspections: 'id, inspectionNumber, timestamp, status, brand, productName, inspectorId',
      products: 'id, productId, brand, productName, barcode, riskScore',
      complaints: 'id, complaintNumber, productName, status, createdAt',
      rules: 'id, ruleCode, category, version',
      users: 'id, badgeNumber, role'
    });
  }
}

export const db = new LegalMetrixDB();
