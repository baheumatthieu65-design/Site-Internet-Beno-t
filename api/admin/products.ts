import {
  parseCookies,
  verifySessionToken,
  getProductsFromDB,
  saveProductsToDB,
} from '../_helpers.js';

const parseBody = (body: any) => {
  if (!body) return {};

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

export default async function handler(req: any, res: any) {
  // ============================================================
  // AUTHENTIFICATION ADMIN
  // ============================================================

  const cookies = parseCookies(req.headers?.cookie);
  const sessionToken = cookies.admin_session;
  const auth = verifySessionToken(sessionToken);

  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Session administrateur non valide ou expirée.',
    });
  }

  try {
    const products = await getProductsFromDB();

    // ============================================================
    // GET
    // ============================================================

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        products,
      });
    }

    // ============================================================
    // POST — CRÉATION
    // ============================================================

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      const product = body.product;

      if (!product || typeof product !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Les données du produit sont obligatoires.',
        });
      }

      if (!product.name || !String(product.name).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du produit est obligatoire.',
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le prix du produit est invalide.',
        });
      }

      const newId =
        product.id && String(product.id).trim()
          ? String(product.id).trim()
          : `produit-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`;

      // Empêche la création de deux produits avec le même ID
      if (products.some((p: any) => p.id === newId)) {
        return res.status(409).json({
          success: false,
          message: 'Un produit avec cet identifiant existe déjà.',
        });
      }

      const newProduct = {
        ...product,
        id: newId,
        name: String(product.name).trim(),
        price,
        currency: product.currency || '€',
        isAvailable:
          product.isAvailable !== undefined
            ? Boolean(product.isAvailable)
            : true,

        colors: Array.isArray(product.colors)
          ? product.colors
          : [{ name: 'Standard', hex: '#8c7d6b' }],

        sizes: Array.isArray(product.sizes)
          ? product.sizes
          : ['S', 'M', 'L', 'XL'],

        fabrics: Array.isArray(product.fabrics)
          ? product.fabrics
          : ['Laine des Pyrénées'],

        features: Array.isArray(product.features)
          ? product.features
          : [],

        specs:
          product.specs && typeof product.specs === 'object'
            ? product.specs
            : {
                weight: 'Standard',
                waterResistance: 'Déperlante',
                warmthRating: 'Élevée',
                fitType: 'Ajustée',
                origin: 'Pyrénées, France',
                care: 'Nettoyage à sec',
              },

        hotspots: Array.isArray(product.hotspots)
          ? product.hotspots
          : [],
      };

      const updatedProducts = [...products, newProduct];

      await saveProductsToDB(updatedProducts);

      return res.status(201).json({
        success: true,
        product: newProduct,
        products: updatedProducts,
        message: 'Produit créé avec succès.',
      });
    }

    // ============================================================
    // PUT — MODIFICATION
    // ============================================================

    if (req.method === 'PUT') {
      const body = parseBody(req.body);
      const product = body.product;

      if (!product || typeof product !== 'object' || !product.id) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant du produit est obligatoire.",
        });
      }

      const existingIndex = products.findIndex(
        (p: any) => p.id === product.id
      );

      if (existingIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé.',
        });
      }

      // Vérification du prix uniquement s'il est modifié
      if (product.price !== undefined) {
        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le prix du produit est invalide.',
          });
        }
      }

      const existingProduct = products[existingIndex];

      const updatedProduct = {
        ...existingProduct,
        ...product,
        id: existingProduct.id,

        price:
          product.price !== undefined
            ? Number(product.price)
            : existingProduct.price,

        name:
          product.name !== undefined
            ? String(product.name).trim()
            : existingProduct.name,

        isAvailable:
          product.isAvailable !== undefined
            ? Boolean(product.isAvailable)
            : existingProduct.isAvailable !== false,
      };

      const updatedProducts = [...products];
      updatedProducts[existingIndex] = updatedProduct;

      await saveProductsToDB(updatedProducts);

      return res.status(200).json({
        success: true,
        product: updatedProduct,
        products: updatedProducts,
        message: 'Produit mis à jour avec succès.',
      });
    }

    // ============================================================
    // DELETE — SUPPRESSION
    // ============================================================

    if (req.method === 'DELETE') {
      const body = parseBody(req.body);

      const productId =
        req.query?.id ||
        body.id ||
        body.productId;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant du produit à supprimer est obligatoire.",
        });
      }

      const exists = products.some(
        (p: any) => p.id === productId
      );

      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé.',
        });
      }

      const updatedProducts = products.filter(
        (p: any) => p.id !== productId
      );

      await saveProductsToDB(updatedProducts);

      return res.status(200).json({
        success: true,
        products: updatedProducts,
        message: 'Produit supprimé avec succès.',
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée.',
    });
  } catch (error: any) {
    console.error('Admin Products Handler Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la gestion du catalogue.',
    });
  }
}
