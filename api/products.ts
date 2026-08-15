import { getProductsFromDB } from './_helpers';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée. Utilisez GET.',
    });
  }

  try {
    const products = await getProductsFromDB();

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