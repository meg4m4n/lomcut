// Add these new types to the existing types.ts file
export interface Point {
  x: number;
  y: number;
}

export interface PathSegment {
  start: Point;
  end: Point;
  isRepair?: boolean;
  type: 'exterior' | 'interior' | 'notch';
}

export interface VectorPath {
  id: string;
  segments: PathSegment[];
  isOpen: boolean;
  repairs: PathRepair[];
  status: 'uncut' | 'cut' | 'defect';
  isExterior: boolean;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  area: number;
}

export interface PathRepair {
  start: Point;
  end: Point;
  distance: number;
  type: 'gap' | 'intersection';
}

export interface PieceStatus {
  id: string;
  status: 'cut' | 'defect' | 'uncut';
  notes: string;
}

export interface ContourAnalysis {
  isNotch: boolean;
  isInterior: boolean;
  length: number;
}

export interface Material {
  name: string;
  supplier: string;
  color: string;
  width: number;
  cutRef?: string;
  dxfFile: File | null;
  pdfFile: File | null;
  sizes: Record<string, number>;
}

export type ServiceType = 
  | 'ESTAMPARIA'
  | 'TRANSFER'
  | 'BORDADO'
  | 'EMBOSSING'
  | 'DTG'
  | 'DTF'
  | 'PEDRAS'
  | 'LAVANDARIA'
  | 'TINGIMENTO'
  | 'CORTE LASER'
  | 'COLADOS'
  | 'OUTROS';

export interface LabelService {
  type: ServiceType;
  enabled: boolean;
  quantity: number;
}

export interface LabelEntry {
  cutRef: string;
  modelRef: string;
  size: string;
  quantity: number;
  services: Record<ServiceType, LabelService>;
  labelsToPrint: number;
}
