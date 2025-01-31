export interface Client {
  name: string;
  brand: string;
}

export interface Material {
  name: string;
  supplier: string;
  color: string;
  width: number;
  dxfFile?: File;
  pdfFile?: File;
}

export type ProtoType = '1st proto' | '2nd proto' | '3rd proto' | 'size-set' | 'production';

export interface CutDetails {
  id: string;
  client: Client;
  orderDate: string;
  deadline: string;
  modelReference: string;
  description: string;
  gender: 'male' | 'female' | 'unisex';
  type: ProtoType;
  projectLink: string;
  status: 'pending' | 'in-progress' | 'completed';
  materials: Material[];
  sizes: Record<string, number>; // size -> quantity
}

export interface PieceStatus {
  id: string;
  status: 'cut' | 'defect' | 'pending';
  notes: string;
}