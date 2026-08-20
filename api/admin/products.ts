import {
  parseCookies,
  verifySessionToken,
  getProductsFromDB,
  saveProductsToDB,
} from '../_helpers.js';

const normalizeProductImages = (product: any) => {
  const gallery = Array.isArray(product?.gallery) ? product.gallery : [];
  const heroImage = String(product?.heroImage || gallery[0] || '').trim();
  const secondaryImages = Array.from(
    new Set(
      gallery
        .map((url: any) => String(url || '').trim())
        .filter(Boolean)
        .filter((url: string) => url !== heroImage)
    )
  );

  return {
    ...product,
    heroImage,
    gallery: Array.from(new Set([heroImage, ...secondaryImages].filter(Boolean))),
  };
};

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
    const products = (await getProductsFromDB()).map(normalizeProductImages);

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
      const product = normalizeProductImages(body.product);

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

      // ------------------------------------------------------------
      // POST action=upsert
      // Le formulaire produit utilise volontairement cette voie pour
      // éviter tout décalage entre le snapshot chargé dans l'admin et
      // l'état réellement présent dans Redis.
      // ------------------------------------------------------------
      if (body.action === 'upsert') {
        const id = String(newId).trim();
        const normalizedName = String(product.name).trim().toLocaleLowerCase();

        let existingIndex = products.findIndex(
          (p: any) => String(p.id || '').trim() === id
        );

        if (existingIndex === -1 && normalizedName) {
          existingIndex = products.findIndex(
            (p: any) =>
              String(p.name || '').trim().toLocaleLowerCase() === normalizedName
          );
        }

        const baseProduct = {
          ...product,
          id: existingIndex >= 0 ? products[existingIndex].id : id,
          name: String(product.name).trim(),
          price,
          currency: product.currency || '€',
          isAvailable: product.isAvailable !== undefined ? Boolean(product.isAvailable) : true,
          colors: Array.isArray(product.colors) ? product.colors : [],
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          fabrics: Array.isArray(product.fabrics) ? product.fabrics : [],
          features: Array.isArray(product.features) ? product.features : [],
          specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
          hotspots: Array.isArray(product.hotspots) ? product.hotspots : [],
        };

        const updatedProducts = [...products];
        if (existingIndex >= 0) {
          updatedProducts[existingIndex] = {
            ...products[existingIndex],
            ...baseProduct,
            id: products[existingIndex].id,
          };
        } else {
          updatedProducts.push(baseProduct);
        }

        await saveProductsToDB(updatedProducts);

        return res.status(200).json({
          success: true,
          product: existingIndex >= 0 ? updatedProducts[existingIndex] : baseProduct,
          products: updatedProducts,
          message: existingIndex >= 0
            ? 'Produit mis à jour avec succès.'
            : 'Produit synchronisé et créé avec succès.',
        });
      }

      // Création classique : on refuse toujours un doublon d'identifiant.
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
      const product = normalizeProductImages(body.product);

      if (!product || typeof product !== 'object' || !product.id) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant du produit est obligatoire.",
        });
      }

      // Le panneau d'administration peut encore contenir un produit issu
      // du snapshot publié alors que Redis possède une version plus ancienne
      // (ou aucun enregistrement avec exactement le même id).
      // Dans ce cas, on tente une correspondance de secours par nom avant
      // d'abandonner. Cela évite qu'une modification d'image soit refusée
      // simplement parce que les deux sources ne partagent pas encore le même id.
      let existingIndex = products.findIndex(
        (p: any) => String(p.id) === String(product.id)
      );

      if (existingIndex === -1 && product.name) {
        const normalizedName = String(product.name).trim().toLocaleLowerCase();
        existingIndex = products.findIndex(
          (p: any) =>
            String(p.name || '').trim().toLocaleLowerCase() === normalizedName
        );
      }

      // Si le produit existe dans le snapshot admin mais pas encore dans Redis,
      // on le crée avec son id afin que la sauvegarde reste atomique et que
      // l'image importée soit immédiatement disponible côté public.
      if (existingIndex === -1) {
        const createdProduct = {
          ...product,
          id: String(product.id).trim(),
          name: String(product.name || '').trim(),
          price: Number(product.price),
          currency: product.currency || '€',
          isAvailable: product.isAvailable !== false,
          colors: Array.isArray(product.colors) ? product.colors : [],
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          fabrics: Array.isArray(product.fabrics) ? product.fabrics : [],
          features: Array.isArray(product.features) ? product.features : [],
          specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
          hotspots: Array.isArray(product.hotspots) ? product.hotspots : [],
        };

        if (!createdProduct.id || !createdProduct.name || !Number.isFinite(createdProduct.price)) {
          return res.status(400).json({
            success: false,
            message: 'Les données du produit sont incomplètes.',
          });
        }

        const updatedProducts = [...products, createdProduct];
        await saveProductsToDB(updatedProducts);

        return res.status(200).json({
          success: true,
          product: createdProduct,
          products: updatedProducts,
          message: 'Produit synchronisé et mis à jour avec succès.',
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
