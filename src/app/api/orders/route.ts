import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const marketplace = searchParams.get('marketplace');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Simulando dados de pedidos
    const mockOrders = [
      {
        id: '1',
        orderNumber: 'ML-001234',
        customer: {
          name: 'João Silva',
          email: 'joao@email.com'
        },
        marketplace: 'Mercado Livre',
        status: 'open',
        total: 299.90,
        items: [
          { name: 'Produto A', quantity: 2, price: 149.95 }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        orderNumber: 'SH-005678',
        customer: {
          name: 'Maria Santos',
          email: 'maria@email.com'
        },
        marketplace: 'Shopee',
        status: 'completed',
        total: 89.90,
        items: [
          { name: 'Produto B', quantity: 1, price: 89.90 }
        ],
        createdAt: '2024-01-14T15:20:00Z',
        updatedAt: '2024-01-16T09:15:00Z'
      },
      {
        id: '3',
        orderNumber: 'AM-009876',
        customer: {
          name: 'Pedro Costa',
          email: 'pedro@email.com'
        },
        marketplace: 'Amazon',
        status: 'cancelled',
        total: 199.90,
        items: [
          { name: 'Produto C', quantity: 1, price: 199.90 }
        ],
        createdAt: '2024-01-13T08:45:00Z',
        updatedAt: '2024-01-13T14:30:00Z'
      },
      {
        id: '4',
        orderNumber: 'MG-112233',
        customer: {
          name: 'Ana Oliveira',
          email: 'ana@email.com'
        },
        marketplace: 'Magalu',
        status: 'returned',
        total: 149.90,
        items: [
          { name: 'Produto D', quantity: 1, price: 149.90 }
        ],
        createdAt: '2024-01-12T16:10:00Z',
        updatedAt: '2024-01-17T11:20:00Z'
      }
    ];

    // Aplicar filtros
    let filteredOrders = mockOrders;

    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    if (marketplace && marketplace !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.marketplace === marketplace);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower) ||
        order.marketplace.toLowerCase().includes(searchLower)
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const response = {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      },
      summary: {
        total: mockOrders.length,
        open: mockOrders.filter(o => o.status === 'open').length,
        cancelled: mockOrders.filter(o => o.status === 'cancelled').length,
        returned: mockOrders.filter(o => o.status === 'returned').length,
        completed: mockOrders.filter(o => o.status === 'completed').length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
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
    if (!body.orderNumber || !body.customer || !body.marketplace) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Simular criação de pedido
    const newOrder = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
