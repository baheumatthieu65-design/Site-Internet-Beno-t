import { getProductsFromDB } from './_helpers.js';

const normalizeProductImages = (product: any) => {
  const gallery = Array.isArray(product?.gallery) ? product.gallery : [];
  const heroImage = String(product?.heroImage || gallery[0] || '').trim();
  const secondaryImages = gallery
    .map((url: any) => String(url || '').trim())
    .filter(Boolean)
    .filter((url: string) => url !== heroImage);

  return {
    ...product,
    heroImage,
    gallery: Array.from(new Set([heroImage, ...secondaryImages].filter(Boolean))),
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée. Utilisez GET.',
    });
  }

  try {
    const products = (await getProductsFromDB()).map(normalizeProductImages);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('Fetch Products Handler Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits.',
    });
  }
}
