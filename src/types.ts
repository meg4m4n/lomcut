// Add these new types to the existing types.ts file
export interface Point {
  x: number;
  y: number;
}

export interface PathSegment {
  start: Point;
  end: Point;
}

export interface VectorPath {
  id: string;
  segments: PathSegment[];
  isOpen: boolean;
  repairs: PathRepair[];
  status: 'uncut' | 'cut' | 'defect';
}

export interface PathRepair {
  start: Point;
  end: Point;
  distance: number;
}

// Update the existing PieceStatus type
export interface PieceStatus {
  id: string;
  status: 'cut' | 'defect' | 'uncut';
  notes: string;
}
