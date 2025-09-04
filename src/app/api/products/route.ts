import { NextRequest, NextResponse } from "next/server";

// Estrutura para armazenar produtos
const MOCK_PRODUCTS: any[] = [];

export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar busca real de produtos do banco de dados
    const products = MOCK_PRODUCTS;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "";

    let filteredProducts = [...MOCK_PRODUCTS];

    // Filtrar por busca
    if (search) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por status
    if (status !== "all") {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }

    // Filtrar por categoria
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Estatísticas
    const stats = {
      total: filteredProducts.length,
      active: filteredProducts.filter(p => p.status === "active").length,
      inactive: filteredProducts.filter(p => p.status === "inactive").length,
      low_stock: filteredProducts.filter(p => p.stock < 10).length
    };

    return NextResponse.json({
      data: paginatedProducts,
      meta: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      },
      stats
    });

  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sku, 
      name, 
      price, 
      stock, 
      category, 
      description, 
      images = [], 
      marketplaces = [], 
      provider = "manual" 
    } = body;

    // Validação
    if (!sku || !name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "SKU, nome, preço e estoque são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar SKU único
    const skuExists = MOCK_PRODUCTS.some(product => product.sku === sku);
    if (skuExists) {
      return NextResponse.json(
        { error: "SKU já existe" },
        { status: 409 }
      );
    }

    // Criar novo produto
    const newProduct = {
      id: (MOCK_PRODUCTS.length + 1).toString(),
      sku: sku.trim(),
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      category: category?.trim() || "Sem categoria",
      description: description?.trim() || "",
      images: Array.isArray(images) ? images : [],
      marketplaces: Array.isArray(marketplaces) ? marketplaces : [],
      provider,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: {
        mercadolivre: "not_synced",
        shopee: "not_synced",
        amazon: "not_synced",
        magalu: "not_synced"
      }
    };

    // Adicionar à lista (em um sistema real, salvaria no banco)
    MOCK_PRODUCTS.push(newProduct);

    return NextResponse.json(newProduct);

  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sku, name, price, stock, category, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      );
    }

    const productIndex = MOCK_PRODUCTS.findIndex(product => product.id === id);
    if (productIndex === -1) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar produto
    const updatedProduct = {
      ...MOCK_PRODUCTS[productIndex],
      ...(sku && { sku: sku.trim() }),
      ...(name && { name: name.trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(category && { category: category.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      updated_at: new Date().toISOString()
    };

    MOCK_PRODUCTS[productIndex] = updatedProduct;

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Produto atualizado com sucesso"
    });

  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      );
    }

    const productIndex = MOCK_PRODUCTS.findIndex(product => product.id === id);
    if (productIndex === -1) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Remover produto
    const deletedProduct = MOCK_PRODUCTS.splice(productIndex, 1)[0];

    return NextResponse.json({
      success: true,
      product: deletedProduct,
      message: "Produto removido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao remover produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
