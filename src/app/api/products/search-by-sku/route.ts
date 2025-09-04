import { NextRequest, NextResponse } from "next/server";

// Estrutura para armazenar produtos dos marketplaces
const MARKETPLACE_PRODUCTS = {
  mercadolivre: [],
  shopee: [],
  amazon: [],
  magalu: []
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get("marketplace");
    const sku = searchParams.get("sku");

    if (!marketplace || !sku) {
      return NextResponse.json(
        { error: "Marketplace e SKU são obrigatórios" },
        { status: 400 }
      );
    }

    // Simular verificação de integração ativa
    const validMarketplaces = ["mercadolivre", "shopee", "amazon", "magalu"];
    if (!validMarketplaces.includes(marketplace)) {
      return NextResponse.json(
        { error: "Marketplace não suportado" },
        { status: 400 }
      );
    }

    // Buscar produtos por SKU no marketplace específico
    const marketplaceProducts = MARKETPLACE_PRODUCTS[marketplace as keyof typeof MARKETPLACE_PRODUCTS] || [];
    
    const filteredProducts = marketplaceProducts.filter((product: any) => {
      const productSku = product.sku || product.item_sku || product.sku;
      return productSku && productSku.toLowerCase().includes(sku.toLowerCase());
    });

    // Normalizar dados para formato padrão
    const normalizedProducts = filteredProducts.map((product: any) => {
      switch (marketplace) {
        case "mercadolivre":
          return {
            id: product.id,
            sku: product.sku,
            name: product.title,
            price: product.price,
            stock: product.available_quantity,
            condition: product.condition,
            category_id: product.category_id,
            images: product.pictures?.map((pic: any) => pic.url) || [],
            marketplace: "mercadolivre",
            marketplace_data: product
          };
        case "shopee":
          return {
            id: product.item_id.toString(),
            sku: product.item_sku,
            name: product.name,
            price: product.price,
            stock: product.stock,
            condition: "new",
            category_id: product.category_id.toString(),
            images: product.images || [],
            marketplace: "shopee",
            marketplace_data: product
          };
        case "amazon":
          return {
            id: product.asin,
            sku: product.sku,
            name: product.title,
            price: product.price,
            stock: product.quantity,
            condition: product.condition.toLowerCase(),
            category_id: product.category,
            images: product.images || [],
            marketplace: "amazon",
            marketplace_data: product
          };
        case "magalu":
          return {
            id: product.product_id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            stock: product.stock_quantity,
            condition: "new",
            category_id: product.category_id,
            images: product.images || [],
            marketplace: "magalu",
            marketplace_data: product
          };
        default:
          return product;
      }
    });

    return NextResponse.json({
      success: true,
      products: normalizedProducts,
      count: normalizedProducts.length,
      marketplace,
      sku
    });

  } catch (error) {
    console.error("Erro ao buscar produtos por SKU:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketplace, sku, product_data } = body;

    if (!marketplace || !sku || !product_data) {
      return NextResponse.json(
        { error: "Marketplace, SKU e dados do produto são obrigatórios" },
        { status: 400 }
      );
    }

    // Simular importação do produto
    const importedProduct = {
      id: `imported_${Date.now()}`,
      sku: sku,
      name: product_data.name,
      price: product_data.price,
      stock: product_data.stock,
      category_id: product_data.category_id,
      provider: marketplace,
      marketplace_id: product_data.id,
      marketplace_data: product_data.marketplace_data,
      created_at: new Date().toISOString(),
      imported_from: marketplace
    };

    return NextResponse.json({
      success: true,
      product: importedProduct,
      message: `Produto importado com sucesso do ${marketplace}`
    });

  } catch (error) {
    console.error("Erro ao importar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
