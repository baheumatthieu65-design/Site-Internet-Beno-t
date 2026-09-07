import { JacketModel } from '../types';

export interface CatalogCategory {
  id: string;
  label: string;
}

/**
 * Les onglets publics de la boutique utilisent le champ `category` des articles.
 * Les catégories créées dans le paramétrage sont conservées même lorsqu'elles
 * n'ont encore aucun article associé.
 */
export const getCatalogCategories = (
  products: JacketModel[],
  configuredCategories: string[] = [],
): CatalogCategory[] => {
  const seen = new Map<string, CatalogCategory>();

  for (const configured of Array.isArray(configuredCategories) ? configuredCategories : []) {
    const label = String(configured || '').trim();
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, { id: label, label });
  }

  for (const product of Array.isArray(products) ? products : []) {
    const label = String(product?.category || '').trim();
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, { id: label, label });
  }

  return Array.from(seen.values());
};

export const getProductsForCategory = (products: JacketModel[], category: string): JacketModel[] =>
  (Array.isArray(products) ? products : []).filter(
    (product) => String(product?.category || '').trim() === String(category || '').trim()
  );

export const getCategoryLabel = (category: string): string => String(category || '').trim() || 'Créations';
