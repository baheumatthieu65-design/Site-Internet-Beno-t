import { CreationType, JacketModel } from '../types';

export const DEFAULT_CREATION_TYPES: CreationType[] = [
  { id: 'signature', label: 'Signatures' },
  { id: 'sport', label: 'Sport' },
  { id: 'goodies', label: 'Goodies' },
];

export const getCreationTypes = (types?: CreationType[]): CreationType[] => {
  const source = Array.isArray(types) ? types : [];
  const valid = source
    .map((type) => ({ id: String(type?.id || '').trim(), label: String(type?.label || '').trim() }))
    .filter((type) => type.id && type.label);

  return valid.length ? valid : DEFAULT_CREATION_TYPES;
};

export const getProductCreationTypeId = (product: JacketModel): string =>
  String(product.creationTypeId || 'signature').trim() || 'signature';

export const getProductsForCreationType = (products: JacketModel[], typeId: string): JacketModel[] =>
  products.filter((product) => getProductCreationTypeId(product) === typeId);

export const getCreationTypeLabel = (types: CreationType[], typeId: string): string =>
  types.find((type) => type.id === typeId)?.label || 'Créations';
