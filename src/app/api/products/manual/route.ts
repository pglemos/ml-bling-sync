import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, name, price, stock, description, category } = body;

    // Validação dos campos obrigatórios
    if (!sku || !name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "SKU, nome, preço e estoque são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de tipos
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: "Preço deve ser um número válido e não negativo" },
        { status: 400 }
      );
    }

    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json(
        { error: "Estoque deve ser um número inteiro válido e não negativo" },
        { status: 400 }
      );
    }

    // Validação de SKU único (simulado)
    // Em um sistema real, você verificaria no banco de dados
    const existingProducts = [
      { sku: "PROD001" },
      { sku: "PROD002" },
      { sku: "PROD003" }
    ];

    const skuExists = existingProducts.some(product => product.sku === sku);
    if (skuExists) {
      return NextResponse.json(
        { error: "SKU já existe. Escolha um SKU único." },
        { status: 409 }
      );
    }

    // Criar produto
    const newProduct = {
      id: `manual_${Date.now()}`,
      sku: sku.trim(),
      name: name.trim(),
      price: Number(price.toFixed(2)),
      stock: Number(stock),
      description: description?.trim() || "",
      category: category?.trim() || "Sem categoria",
      provider: "manual",
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

    // Simular salvamento no banco de dados
    // Em um sistema real, você salvaria no banco de dados aqui
    console.log("Produto criado:", newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Produto cadastrado com sucesso"
    });

  } catch (error) {
    console.error("Erro ao cadastrar produto manual:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para listar produtos manuais
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Simular produtos manuais existentes
    const manualProducts = [
      {
        id: "manual_1",
        sku: "MANUAL001",
        name: "Produto Manual 1",
        price: 99.99,
        stock: 50,
        description: "Produto cadastrado manualmente",
        category: "Eletrônicos",
        provider: "manual",
        status: "active",
        created_at: "2024-01-15T10:00:00Z"
      },
      {
        id: "manual_2",
        sku: "MANUAL002",
        name: "Produto Manual 2",
        price: 149.99,
        stock: 25,
        description: "Outro produto cadastrado manualmente",
        category: "Casa e Jardim",
        provider: "manual",
        status: "active",
        created_at: "2024-01-16T14:30:00Z"
      }
    ];

    // Filtrar por busca se fornecida
    let filteredProducts = manualProducts;
    if (search) {
      filteredProducts = manualProducts.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao buscar produtos manuais:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
