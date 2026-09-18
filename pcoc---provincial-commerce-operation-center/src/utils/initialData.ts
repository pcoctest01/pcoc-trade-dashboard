import { Database } from '../types';

/**
 * ฐานข้อมูลตัวอย่างเริ่มต้น (Mock/Seed Dataset)
 * อ้างอิงสถิติการค้าชายแดนไทย-สปป.ลาว (ด่านศุลกากรหนองคาย/มุกดาหาร)
 * เพื่อให้สามารถเปิดใช้งานและทดสอบฟังก์ชันทั้งหมดได้ทันที
 */
export const INITIAL_BORDER_TRADE_DATA: Database = {
  '2026-09': {
    period: '2026-09',
    periodName: 'กันยายน 2569',
    summary: {
      export: 7854.42,
      import: 2415.86,
      total: 10270.28,
      balance: 5438.56,
    },
    logistics: {
      truckIn: 4820,
      truckOut: 5310,
      transitIn: 1250,
      transitOut: 1480,
      passIn: 45200,
      passOut: 48600,
      transitValueIn: 845.20,
      transitValueOut: 1120.50,
    },
    exports: [
      { id: 1, hsCode: '2710', name: 'น้ำมันดีเซลและน้ำมันสำเร็จรูป', qty: '45,200,000', weight: '38,200', value: 2450.80, dest: 'สปป.ลาว' },
      { id: 2, hsCode: '8708', name: 'ชิ้นส่วนและอุปกรณ์ประกอบยานยนต์', qty: '12,500', weight: '2,800', value: 980.50, dest: 'สปป.ลาว' },
      { id: 3, hsCode: '8528', name: 'เครื่องรับโทรทัศน์และอุปกรณ์ส่งสัญญาณ', qty: '8,400', weight: '1,450', value: 720.40, dest: 'สปป.ลาว' },
      { id: 4, hsCode: '1701', name: 'น้ำตาลทรายบริสุทธิ์', qty: '24,000', weight: '24,000', value: 680.25, dest: 'สปป.ลาว' },
      { id: 5, hsCode: '8504', name: 'หม้อแปลงไฟฟ้าและอุปกรณ์แปลงไฟฟ้าสถิต', qty: '4,200', weight: '950', value: 540.60, dest: 'สปป.ลาว' },
      { id: 6, hsCode: '3901', name: 'โพลิเมอร์ของเอทิลีนในลักษณะขั้นปฐม', qty: '15,000', weight: '15,000', value: 460.30, dest: 'สปป.ลาว' },
      { id: 7, hsCode: '2523', name: 'ปูนซีเมนต์ปอร์ตแลนด์', qty: '65,000', weight: '65,000', value: 410.15, dest: 'สปป.ลาว' },
      { id: 8, hsCode: '8471', name: 'เครื่องประมวลผลข้อมูลอัตโนมัติ (คอมพิวเตอร์)', qty: '3,800', weight: '420', value: 385.20, dest: 'สปป.ลาว' },
      { id: 9, hsCode: '0402', name: 'นมและครีมข้นหวาน/จืด', qty: '8,200', weight: '8,200', value: 310.45, dest: 'สปป.ลาว' },
      { id: 10, hsCode: '2202', name: 'เครื่องดื่มไม่มีแอลกอฮอล์และน้ำแร่ปรุงรส', qty: '18,500', weight: '18,500', value: 295.10, dest: 'สปป.ลาว' },
      { id: 11, hsCode: '7214', name: 'เหล็กเส้นและเหล็กข้ออ้อย', qty: '9,400', weight: '9,400', value: 260.80, dest: 'สปป.ลาว' },
    ],
    imports: [
      { id: 1, hsCode: '2716', name: 'พลังงานไฟฟ้า', qty: '1,450,000,000', weight: '0', value: 1250.40, origin: 'สปป.ลาว' },
      { id: 2, hsCode: '2603', name: 'สินแร่ทองแดงและหัวแร่', qty: '4,800', weight: '4,800', value: 380.20, origin: 'สปป.ลาว' },
      { id: 3, hsCode: '4407', name: 'ไม้แปรรูปและผลิตภัณฑ์จากไม้', qty: '3,200', weight: '3,200', value: 240.60, origin: 'สปป.ลาว' },
      { id: 4, hsCode: '0714', name: 'มันสำปะหลังเส้นและแป้งมัน', qty: '28,000', weight: '28,000', value: 195.45, origin: 'สปป.ลาว' },
      { id: 5, hsCode: '0901', name: 'เมล็ดกาแฟดิบยังไม่คั่ว', qty: '1,800', weight: '1,800', value: 145.30, origin: 'สปป.ลาว' },
      { id: 6, hsCode: '2608', name: 'สินแร่สังกะสีและหัวแร่', qty: '2,100', weight: '2,100', value: 115.80, origin: 'สปป.ลาว' },
      { id: 7, hsCode: '1005', name: 'ข้าวโพดเลี้ยงสัตว์', qty: '12,500', weight: '12,500', value: 88.11, origin: 'สปป.ลาว' },
    ],
  },
  '2026-08': {
    period: '2026-08',
    periodName: 'สิงหาคม 2569',
    summary: {
      export: 7420.15,
      import: 2280.40,
      total: 9700.55,
      balance: 5139.75,
    },
    logistics: {
      truckIn: 4610,
      truckOut: 5120,
      transitIn: 1180,
      transitOut: 1390,
      passIn: 43800,
      passOut: 46900,
      transitValueIn: 810.00,
      transitValueOut: 1040.20,
    },
    exports: [
      { id: 1, hsCode: '2710', name: 'น้ำมันดีเซลและน้ำมันสำเร็จรูป', qty: '43,000,000', weight: '36,500', value: 2310.50, dest: 'สปป.ลาว' },
      { id: 2, hsCode: '8708', name: 'ชิ้นส่วนและอุปกรณ์ประกอบยานยนต์', qty: '11,800', weight: '2,600', value: 920.00, dest: 'สปป.ลาว' },
      { id: 3, hsCode: '8528', name: 'เครื่องรับโทรทัศน์และอุปกรณ์ส่งสัญญาณ', qty: '8,000', weight: '1,380', value: 690.10, dest: 'สปป.ลาว' },
      { id: 4, hsCode: '1701', name: 'น้ำตาลทรายบริสุทธิ์', qty: '22,500', weight: '22,500', value: 640.80, dest: 'สปป.ลาว' },
      { id: 5, hsCode: '8504', name: 'หม้อแปลงไฟฟ้าและอุปกรณ์แปลงไฟฟ้าสถิต', qty: '3,900', weight: '880', value: 510.20, dest: 'สปป.ลาว' },
      { id: 6, hsCode: '3901', name: 'โพลิเมอร์ของเอทิลีนในลักษณะขั้นปฐม', qty: '14,200', weight: '14,200', value: 435.00, dest: 'สปป.ลาว' },
      { id: 7, hsCode: '2523', name: 'ปูนซีเมนต์ปอร์ตแลนด์', qty: '61,000', weight: '61,000', value: 395.50, dest: 'สปป.ลาว' },
    ],
    imports: [
      { id: 1, hsCode: '2716', name: 'พลังงานไฟฟ้า', qty: '1,410,000,000', weight: '0', value: 1190.20, origin: 'สปป.ลาว' },
      { id: 2, hsCode: '2603', name: 'สินแร่ทองแดงและหัวแร่', qty: '4,500', weight: '4,500', value: 360.50, origin: 'สปป.ลาว' },
      { id: 3, hsCode: '4407', name: 'ไม้แปรรูปและผลิตภัณฑ์จากไม้', qty: '3,000', weight: '3,000', value: 230.10, origin: 'สปป.ลาว' },
      { id: 4, hsCode: '0714', name: 'มันสำปะหลังเส้นและแป้งมัน', qty: '26,500', weight: '26,500', value: 185.00, origin: 'สปป.ลาว' },
    ],
  },
  '2026-07': {
    period: '2026-07',
    periodName: 'กรกฎาคม 2569',
    summary: {
      export: 7180.60,
      import: 2190.30,
      total: 9370.90,
      balance: 4990.30,
    },
    logistics: {
      truckIn: 4500,
      truckOut: 4980,
      transitIn: 1120,
      transitOut: 1320,
      passIn: 42100,
      passOut: 45300,
      transitValueIn: 780.40,
      transitValueOut: 990.80,
    },
    exports: [
      { id: 1, hsCode: '2710', name: 'น้ำมันดีเซลและน้ำมันสำเร็จรูป', qty: '41,500,000', weight: '35,000', value: 2240.20, dest: 'สปป.ลาว' },
      { id: 2, hsCode: '8708', name: 'ชิ้นส่วนและอุปกรณ์ประกอบยานยนต์', qty: '11,200', weight: '2,500', value: 890.40, dest: 'สปป.ลาว' },
      { id: 3, hsCode: '8528', name: 'เครื่องรับโทรทัศน์และอุปกรณ์ส่งสัญญาณ', qty: '7,600', weight: '1,300', value: 660.00, dest: 'สปป.ลาว' },
      { id: 4, hsCode: '1701', name: 'น้ำตาลทรายบริสุทธิ์', qty: '21,000', weight: '21,000', value: 615.00, dest: 'สปป.ลาว' },
    ],
    imports: [
      { id: 1, hsCode: '2716', name: 'พลังงานไฟฟ้า', qty: '1,380,000,000', weight: '0', value: 1150.00, origin: 'สปป.ลาว' },
      { id: 2, hsCode: '2603', name: 'สินแร่ทองแดงและหัวแร่', qty: '4,300', weight: '4,300', value: 345.00, origin: 'สปป.ลาว' },
    ],
  },
  '2025-09': {
    period: '2025-09',
    periodName: 'กันยายน 2568',
    summary: {
      export: 6950.30,
      import: 2110.50,
      total: 9060.80,
      balance: 4839.80,
    },
    logistics: {
      truckIn: 4300,
      truckOut: 4800,
      transitIn: 1050,
      transitOut: 1250,
      passIn: 40500,
      passOut: 43200,
      transitValueIn: 720.00,
      transitValueOut: 910.00,
    },
    exports: [
      { id: 1, hsCode: '2710', name: 'น้ำมันดีเซลและน้ำมันสำเร็จรูป', qty: '39,000,000', weight: '33,000', value: 2100.50, dest: 'สปป.ลาว' },
      { id: 2, hsCode: '8708', name: 'ชิ้นส่วนและอุปกรณ์ประกอบยานยนต์', qty: '10,500', weight: '2,300', value: 840.20, dest: 'สปป.ลาว' },
      { id: 3, hsCode: '8528', name: 'เครื่องรับโทรทัศน์และอุปกรณ์ส่งสัญญาณ', qty: '7,100', weight: '1,200', value: 610.50, dest: 'สปป.ลาว' },
      { id: 4, hsCode: '1701', name: 'น้ำตาลทรายบริสุทธิ์', qty: '19,500', weight: '19,500', value: 580.00, dest: 'สปป.ลาว' },
    ],
    imports: [
      { id: 1, hsCode: '2716', name: 'พลังงานไฟฟ้า', qty: '1,320,000,000', weight: '0', value: 1100.00, origin: 'สปป.ลาว' },
      { id: 2, hsCode: '2603', name: 'สินแร่ทองแดงและหัวแร่', qty: '4,000', weight: '4,000', value: 320.00, origin: 'สปป.ลาว' },
    ],
  },
};

export const INITIAL_DATABASE = INITIAL_BORDER_TRADE_DATA;
