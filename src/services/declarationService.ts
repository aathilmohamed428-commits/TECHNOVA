import { ExtractedDeclaration, DeclarationStatus, BoundingBox } from '../types';
import { OCRRawOutput, OCRLineResult } from './ocrService';

export class DeclarationParserService {
  public static parseDeclarations(ocr: OCRRawOutput, imageId: string): ExtractedDeclaration[] {
    const declarations: ExtractedDeclaration[] = [];
    const fullText = ocr.fullText;
    const lines = ocr.lines;

    // 1. MRP Extraction
    const mrpLine = this.findMatchingLine(lines, /(mrp|max\.?\s*retail|incl\.?\s*of\s*all\s*taxes|₹|rs\.?)/i);
    if (mrpLine) {
      declarations.push({
        id: `decl-mrp-${Date.now()}`,
        type: 'MRP',
        label: 'Maximum Retail Price (MRP)',
        rawValue: mrpLine.text,
        normalizedValue: this.extractPriceValue(mrpLine.text),
        status: mrpLine.confidence > 60 ? 'DETECTED' : 'REVIEW_REQUIRED',
        confidence: mrpLine.confidence,
        imageId,
        boundingBox: mrpLine.bbox,
        notes: 'Rule 6(1)(e) declaration detected'
      });
    } else {
      declarations.push({
        id: `decl-mrp-${Date.now()}`,
        type: 'MRP',
        label: 'Maximum Retail Price (MRP)',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId,
        notes: 'Mandatory MRP declaration missing or unreadable on this view'
      });
    }

    // 2. Net Quantity Extraction
    const netQtyLine = this.findMatchingLine(lines, /(net\s*(qty|wt|weight|quantity)|net\s*:\s*\d+|^\d+\s*(g|kg|ml|l|gm|grams|n|pcs)\b)/i);
    if (netQtyLine) {
      declarations.push({
        id: `decl-netqty-${Date.now()}`,
        type: 'NET_QUANTITY',
        label: 'Net Quantity',
        rawValue: netQtyLine.text,
        normalizedValue: this.normalizeQuantity(netQtyLine.text),
        status: netQtyLine.confidence > 60 ? 'DETECTED' : 'REVIEW_REQUIRED',
        confidence: netQtyLine.confidence,
        imageId,
        boundingBox: netQtyLine.bbox
      });
    } else {
      declarations.push({
        id: `decl-netqty-${Date.now()}`,
        type: 'NET_QUANTITY',
        label: 'Net Quantity',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId
      });
    }

    // 3. Unit Sale Price
    const uspLine = this.findMatchingLine(lines, /(unit\s*sale\s*price|usp|₹\s*\/\s*g|₹\s*\/\s*ml|rs\.?\s*\/\s*g)/i);
    if (uspLine) {
      declarations.push({
        id: `decl-usp-${Date.now()}`,
        type: 'UNIT_SALE_PRICE',
        label: 'Unit Sale Price',
        rawValue: uspLine.text,
        normalizedValue: uspLine.text,
        status: 'DETECTED',
        confidence: uspLine.confidence,
        imageId,
        boundingBox: uspLine.bbox
      });
    } else {
      declarations.push({
        id: `decl-usp-${Date.now()}`,
        type: 'UNIT_SALE_PRICE',
        label: 'Unit Sale Price',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId
      });
    }

    // 4. Manufacturing / Packing Date
    const mfgLine = this.findMatchingLine(lines, /(mfd|mfg|pkd|packed|pkg|date\s*of\s*(mfg|packing)|manufactured)/i);
    if (mfgLine) {
      declarations.push({
        id: `decl-mfg-${Date.now()}`,
        type: 'MFG_PACKING_DATE',
        label: 'Month & Year of Manufacture/Packing',
        rawValue: mfgLine.text,
        normalizedValue: this.extractDateStr(mfgLine.text),
        status: 'DETECTED',
        confidence: mfgLine.confidence,
        imageId,
        boundingBox: mfgLine.bbox
      });
    } else {
      declarations.push({
        id: `decl-mfg-${Date.now()}`,
        type: 'MFG_PACKING_DATE',
        label: 'Month & Year of Manufacture/Packing',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId
      });
    }

    // 5. Manufacturer / Packer Details
    const mfrLine = this.findMatchingLine(lines, /(mfd\.?\s*by|manufactured\s*by|marketed\s*by|packed\s*by|pvt\.?\s*ltd|ltd|inc|corp)/i);
    if (mfrLine) {
      declarations.push({
        id: `decl-mfr-${Date.now()}`,
        type: 'MANUFACTURER_NAME',
        label: 'Manufacturer / Packer Name & Address',
        rawValue: mfrLine.text,
        normalizedValue: mfrLine.text,
        status: 'DETECTED',
        confidence: mfrLine.confidence,
        imageId,
        boundingBox: mfrLine.bbox
      });
    } else {
      declarations.push({
        id: `decl-mfr-${Date.now()}`,
        type: 'MANUFACTURER_NAME',
        label: 'Manufacturer / Packer Name & Address',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId
      });
    }

    // 6. Consumer Care Cell
    const careLine = this.findMatchingLine(lines, /(consumer\s*care|customer\s*care|toll\s*free|feedback|complaint|care@|email|tel|phone)/i);
    if (careLine) {
      declarations.push({
        id: `decl-care-${Date.now()}`,
        type: 'CONSUMER_CARE',
        label: 'Consumer Care Cell Details',
        rawValue: careLine.text,
        normalizedValue: careLine.text,
        status: 'DETECTED',
        confidence: careLine.confidence,
        imageId,
        boundingBox: careLine.bbox
      });
    } else {
      declarations.push({
        id: `decl-care-${Date.now()}`,
        type: 'CONSUMER_CARE',
        label: 'Consumer Care Cell Details',
        rawValue: 'NOT FOUND',
        normalizedValue: '',
        status: 'NOT_DETECTED',
        confidence: 0,
        imageId
      });
    }

    // 7. Country of Origin
    const originLine = this.findMatchingLine(lines, /(country\s*of\s*origin|made\s*in|product\s*of|india)/i);
    if (originLine) {
      declarations.push({
        id: `decl-origin-${Date.now()}`,
        type: 'COUNTRY_OF_ORIGIN',
        label: 'Country of Origin',
        rawValue: originLine.text,
        normalizedValue: originLine.text.includes('INDIA') ? 'India' : originLine.text,
        status: 'DETECTED',
        confidence: originLine.confidence,
        imageId,
        boundingBox: originLine.bbox
      });
    }

    return declarations;
  }

  private static findMatchingLine(lines: OCRLineResult[], regex: RegExp): OCRLineResult | undefined {
    return lines.find(l => regex.test(l.text));
  }

  private static extractPriceValue(text: string): string {
    const match = text.match(/(?:₹|rs\.?|mrp)?\s*([\d,]+\.?\d*)/i);
    return match ? `₹${match[1]}` : text;
  }

  private static normalizeQuantity(text: string): string {
    const match = text.match(/([\d.]+\s*(g|kg|ml|l|ltr|gm|grams|n|pcs))/i);
    return match ? match[1] : text;
  }

  private static extractDateStr(text: string): string {
    const match = text.match(/(\d{2}[\/\.-]\d{2,4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{2,4}\b)/i);
    return match ? match[1] : text;
  }
}
