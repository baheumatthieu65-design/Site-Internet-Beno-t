import type { JacketModel } from '../types';
import { getProductAvailabilityStatus } from './productStatus';

const statusRank = {
  'on-sale': 0,
  'coming-soon': 1,
  'sold-out': 2,
} as const;

/** Ordre public demandé : En vente → Bientôt disponibles → Épuisés. */
export const sortProductsByAvailability = <T extends JacketModel>(products: T[]): T[] =>
  products
    .map((product, index) => ({ product, index, rank: statusRank[getProductAvailabilityStatus(product)] }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ product }) => product);
