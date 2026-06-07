export interface MenuDiarioItem {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  imageUrl: string | null;
  productPrice: number;
  date: string;
  estimatedPortions: number;
  usedPortions: number;
  remainingPortions: number;
  soldOut: boolean;
}
