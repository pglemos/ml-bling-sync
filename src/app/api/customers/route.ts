import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get('marketplace');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Simulando dados de clientes
    const mockCustomers: any[] = [];
    
    // TODO: Implementar busca real de clientes do banco de dados
    // const customers = await getCustomersFromDatabase();
    
    // Dados fictícios removidos - implementar integração com banco de dados
    // TODO: Implementar busca real de clientes
    
    const customers: any[] = [];

    // Aplicar filtros
    let filteredCustomers = customers;

    if (marketplace && marketplace !== 'all') {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.marketplaces && customer.marketplaces.includes(marketplace)
      );
    }

    if (status && status !== 'all') {
      filteredCustomers = filteredCustomers.filter(customer => customer.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.document?.toLowerCase().includes(searchLower)
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    // Calcular estatísticas
    const totalCustomers = mockCustomers.length;
    const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
    const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const response = {
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / limit)
      },
      stats: {
        totalCustomers,
        activeCustomers,
        totalRevenue,
        avgOrderValue
      },
      marketplaces: [...new Set(mockCustomers.flatMap(c => c.marketplaces))]
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Simular criação de cliente
    const newCustomer = {
      id: Date.now().toString(),
      ...body,
      totalOrders: 0,
      totalSpent: 0,
      status: 'active',
      firstPurchase: new Date().toISOString(),
      lastPurchase: new Date().toISOString()
    };

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
