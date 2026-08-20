import {
  parseCookies,
  verifySessionToken,
  getProductsFromDB,
  saveProductsToDB,
} from '../../api/_helpers.js';

const normalizeProductImages = (product: any) => {
  const gallery = Array.isArray(product?.gallery) ? product.gallery : [];
  // Convention canonique : si une galerie existe, son premier élément est
  // l'image principale. Cela répare les anciennes fiches où heroImage était
  // resté sur une photo historique.
  // heroImage is authoritative; gallery[0] can be stale on older records.
  const explicitHero = String(product?.heroImage || '').trim();
  const galleryPrimary = String(gallery[0] || '').trim();
  const heroImage = String(explicitHero || galleryPrimary || '').trim();
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

const normalizeProductRecord = (product: any) => {
  const normalized = normalizeProductImages(product || {});
  return {
    ...normalized,
    id: String(normalized.id || '').trim(),
    name: String(normalized.name || '').trim(),
    price: Number(normalized.price),
    currency: normalized.currency || '€',
    isAvailable: normalized.isAvailable !== undefined ? Boolean(normalized.isAvailable) : true,
    colors: Array.isArray(normalized.colors) ? normalized.colors : [],
    sizes: Array.isArray(normalized.sizes) ? normalized.sizes : [],
    fabrics: Array.isArray(normalized.fabrics) ? normalized.fabrics : [],
    features: Array.isArray(normalized.features) ? normalized.features : [],
    specs: normalized.specs && typeof normalized.specs === 'object' ? normalized.specs : {},
    hotspots: Array.isArray(normalized.hotspots) ? normalized.hotspots : [],
  };
};

export default async function handler(req: any, res: any) {
  const cookies = parseCookies(req.headers?.cookie);
  const auth = verifySessionToken(cookies.admin_session);

  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Session administrateur non valide ou expirée.',
    });
  }

  try {
    const products = (await getProductsFromDB()).map(normalizeProductImages);

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, products });
    }

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      const incoming = body.product;

      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ success: false, message: 'Les données du produit sont obligatoires.' });
      }

      if (!incoming.name || !String(incoming.name).trim()) {
        return res.status(400).json({ success: false, message: 'Le nom du produit est obligatoire.' });
      }

      const price = Number(incoming.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Le prix du produit est invalide.' });
      }

      const requestedId = incoming.id && String(incoming.id).trim()
        ? String(incoming.id).trim()
        : `produit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (body.action === 'upsert') {
        const normalizedName = String(incoming.name).trim().toLocaleLowerCase();
        let existingIndex = products.findIndex((p: any) => String(p.id || '').trim() === requestedId);

        if (existingIndex === -1 && normalizedName) {
          existingIndex = products.findIndex(
            (p: any) => String(p.name || '').trim().toLocaleLowerCase() === normalizedName
          );
        }

        const base = normalizeProductRecord({
          ...incoming,
          id: existingIndex >= 0 ? products[existingIndex].id : requestedId,
          price,
        });

        if (!base.id || !base.name || !Number.isFinite(base.price)) {
          return res.status(400).json({ success: false, message: 'Les données du produit sont incomplètes.' });
        }

        const updatedProducts = [...products];
        if (existingIndex >= 0) {
          updatedProducts[existingIndex] = {
            ...products[existingIndex],
            ...base,
            id: products[existingIndex].id,
          };
        } else {
          updatedProducts.push(base);
        }

        await saveProductsToDB(updatedProducts);
        return res.status(200).json({
          success: true,
          product: existingIndex >= 0 ? updatedProducts[existingIndex] : base,
          products: updatedProducts,
          message: existingIndex >= 0 ? 'Produit mis à jour avec succès.' : 'Produit créé avec succès.',
        });
      }

      if (products.some((p: any) => String(p.id) === requestedId)) {
        return res.status(409).json({ success: false, message: 'Un produit avec cet identifiant existe déjà.' });
      }

      const newProduct = normalizeProductRecord({
        ...incoming,
        id: requestedId,
        price,
        colors: Array.isArray(incoming.colors) ? incoming.colors : [{ name: 'Standard', hex: '#8c7d6b' }],
        sizes: Array.isArray(incoming.sizes) ? incoming.sizes : ['S', 'M', 'L', 'XL'],
        fabrics: Array.isArray(incoming.fabrics) ? incoming.fabrics : ['Laine des Pyrénées'],
      });

      const updatedProducts = [...products, newProduct];
      await saveProductsToDB(updatedProducts);
      return res.status(201).json({ success: true, product: newProduct, products: updatedProducts, message: 'Produit créé avec succès.' });
    }

    if (req.method === 'PUT') {
      const body = parseBody(req.body);

      // Publication atomique du catalogue : utilisée par le panneau admin
      // pour appliquer en une seule fois toutes les modifications validées.
      if (body.action === 'replace' && Array.isArray(body.products)) {
        const normalizedProducts = body.products.map((product: any) => normalizeProductRecord(product));
        const invalid = normalizedProducts.find((product: any) => !product.id || !product.name || !Number.isFinite(product.price));
        if (invalid) {
          return res.status(400).json({ success: false, message: 'Un ou plusieurs produits sont incomplets ou invalides.' });
        }
        const ids = new Set<string>();
        for (const product of normalizedProducts) {
          if (ids.has(product.id)) {
            return res.status(409).json({ success: false, message: `Identifiant produit dupliqué : ${product.id}` });
          }
          ids.add(product.id);
        }
        await saveProductsToDB(normalizedProducts);
        return res.status(200).json({ success: true, products: normalizedProducts, message: 'Catalogue publié en une seule opération.' });
      }

      const incoming = body.product;

      if (!incoming || typeof incoming !== 'object' || !incoming.id) {
        return res.status(400).json({ success: false, message: "L'identifiant du produit est obligatoire." });
      }

      let existingIndex = products.findIndex((p: any) => String(p.id) === String(incoming.id));
      if (existingIndex === -1 && incoming.name) {
        const normalizedName = String(incoming.name).trim().toLocaleLowerCase();
        existingIndex = products.findIndex(
          (p: any) => String(p.name || '').trim().toLocaleLowerCase() === normalizedName
        );
      }

      if (existingIndex === -1) {
        const created = normalizeProductRecord(incoming);
        if (!created.id || !created.name || !Number.isFinite(created.price)) {
          return res.status(400).json({ success: false, message: 'Les données du produit sont incomplètes.' });
        }
        const updatedProducts = [...products, created];
        await saveProductsToDB(updatedProducts);
        return res.status(200).json({ success: true, product: created, products: updatedProducts, message: 'Produit synchronisé et mis à jour avec succès.' });
      }

      if (incoming.price !== undefined) {
        const price = Number(incoming.price);
        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({ success: false, message: 'Le prix du produit est invalide.' });
        }
      }

      const existingProduct = products[existingIndex];
      const updatedProduct = normalizeProductRecord({
        ...existingProduct,
        ...incoming,
        id: existingProduct.id,
        price: incoming.price !== undefined ? Number(incoming.price) : existingProduct.price,
        name: incoming.name !== undefined ? String(incoming.name).trim() : existingProduct.name,
        isAvailable: incoming.isAvailable !== undefined ? Boolean(incoming.isAvailable) : existingProduct.isAvailable !== false,
      });

      const updatedProducts = [...products];
      updatedProducts[existingIndex] = updatedProduct;
      await saveProductsToDB(updatedProducts);
      return res.status(200).json({ success: true, product: updatedProduct, products: updatedProducts, message: 'Produit mis à jour avec succès.' });
    }

    if (req.method === 'DELETE') {
      const body = parseBody(req.body);
      const productId = req.query?.id || body.id || body.productId;

      if (!productId) {
        return res.status(400).json({ success: false, message: "L'identifiant du produit à supprimer est obligatoire." });
      }

      const exists = products.some((p: any) => String(p.id) === String(productId));
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé.' });
      }

      const updatedProducts = products.filter((p: any) => String(p.id) !== String(productId));
      await saveProductsToDB(updatedProducts);
      return res.status(200).json({ success: true, products: updatedProducts, message: 'Produit supprimé avec succès.' });
    }

    return res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
  } catch (error: any) {
    console.error('Admin Products Handler Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la gestion du catalogue.' });
  }
}
