import { JacketAvailabilityStatus, JacketModel } from '../types';

export const getProductAvailabilityStatus = (product: Pick<JacketModel, 'isAvailable' | 'availabilityStatus'>): JacketAvailabilityStatus => {
  if (product.availabilityStatus === 'coming-soon') return 'coming-soon';
  if (product.availabilityStatus === 'sold-out') return 'sold-out';
  if (product.availabilityStatus === 'on-sale') return 'on-sale';
  return product.isAvailable === false ? 'sold-out' : 'on-sale';
};

export const getProductStatusLabel = (product: Pick<JacketModel, 'isAvailable' | 'availabilityStatus'>): string => {
  switch (getProductAvailabilityStatus(product)) {
    case 'sold-out': return 'Épuisé';
    case 'coming-soon': return 'Bientôt disponible';
    default: return 'En vente';
  }
};

export const isProductOrderable = (product: Pick<JacketModel, 'isAvailable' | 'availabilityStatus'>): boolean =>
  getProductAvailabilityStatus(product) === 'on-sale';

export const normalizeProductAvailability = <T extends Pick<JacketModel, 'isAvailable' | 'availabilityStatus'>>(product: T): T => {
  const status = getProductAvailabilityStatus(product);
  return {
    ...product,
    availabilityStatus: status,
    isAvailable: status === 'on-sale',
  };
};
