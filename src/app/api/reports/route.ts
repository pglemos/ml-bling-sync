import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const type = searchParams.get('type') || 'overview'

    // Calcular data de início baseada no período
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    switch (type) {
      case 'overview':
        return await getOverviewData(startDate, now)
      case 'products':
        return await getProductsData(startDate, now)
      case 'customers':
        return await getCustomersData(startDate, now)
      case 'analytics':
        return await getAnalyticsData(startDate, now)
      default:
        return await getOverviewData(startDate, now)
    }
  } catch (error) {
    console.error('Erro ao buscar dados de relatórios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function getOverviewData(startDate: Date, endDate: Date) {
  try {
    // Buscar dados de vendas por mês
    const { data: salesData, error: salesError } = await supabase
      .from('orders')
      .select(`
        created_at,
        total_amount,
        status
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (salesError) throw salesError

    // Buscar dados de produtos mais vendidos
    const { data: topProducts, error: productsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(
          created_at,
          status
        ),
        products(
          name,
          category,
          supplier_id
        )
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())
      .eq('orders.status', 'completed')

    if (productsError) throw productsError

    // Buscar dados de categorias
    const { data: categoryData, error: categoryError } = await supabase
      .from('products')
      .select('category')

    if (categoryError) throw categoryError

    // Processar dados de vendas mensais
    const monthlySales = processMonthlySales(salesData || [])
    
    // Processar produtos mais vendidos
    const processedProducts = processTopProducts(topProducts || [])
    
    // Processar dados de categorias
    const processedCategories = processCategoryData(categoryData || [])

    // Calcular métricas gerais
    const totalRevenue = (salesData || []).reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const totalOrders = (salesData || []).length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
      },
      salesData: monthlySales,
      topProducts: processedProducts.slice(0, 10),
      categoryData: processedCategories
    })
  } catch (error) {
    console.error('Erro ao buscar dados de overview:', error)
    throw error
  }
}

async function getProductsData(startDate: Date, endDate: Date) {
  try {
    const { data: productSales, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(
          created_at,
          status,
          customer_id
        ),
        products(
          name,
          category,
          supplier_id,
          suppliers(
            name
          )
        )
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())
      .eq('orders.status', 'completed')

    if (error) throw error

    const processedProducts = processDetailedProducts(productSales || [])

    return NextResponse.json({
      products: processedProducts,
      totalProducts: processedProducts.length
    })
  } catch (error) {
    console.error('Erro ao buscar dados de produtos:', error)
    throw error
  }
}

async function getCustomersData(startDate: Date, endDate: Date) {
  try {
    const { data: customerOrders, error } = await supabase
      .from('orders')
      .select(`
        customer_id,
        total_amount,
        created_at,
        status,
        customers(
          name,
          email,
          created_at,
          city,
          state
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (error) throw error

    const processedCustomers = processTopCustomers(customerOrders || [])

    return NextResponse.json({
      customers: processedCustomers,
      totalCustomers: processedCustomers.length
    })
  } catch (error) {
    console.error('Erro ao buscar dados de clientes:', error)
    throw error
  }
}

async function getAnalyticsData(startDate: Date, endDate: Date) {
  try {
    // Buscar dados para analytics avançado
    const { data: analyticsData, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        total_amount,
        status,
        customer_id,
        order_items(
          quantity,
          price,
          product_id,
          products(
            category
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    const analytics = processAnalyticsData(analyticsData || [])

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Erro ao buscar dados de analytics:', error)
    throw error
  }
}

// Funções auxiliares para processamento de dados
function processMonthlySales(salesData: any[]) {
  const monthlyData: { [key: string]: { sales: number; customers: Set<string> } } = {}
  
  salesData.forEach(order => {
    const date = new Date(order.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { sales: 0, customers: new Set() }
    }
    
    monthlyData[monthKey].sales += order.total_amount || 0
    monthlyData[monthKey].customers.add(order.customer_id)
  })
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
      sales: data.sales,
      customers: data.customers.size
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function processTopProducts(productSales: any[]) {
  const productStats: { [key: string]: any } = {}
  
  productSales.forEach(item => {
    const productId = item.product_id
    
    if (!productStats[productId]) {
      productStats[productId] = {
        id: productId,
        name: item.products?.name || 'Produto sem nome',
        category: item.products?.category || 'Sem categoria',
        supplier: item.products?.supplier_id || 'Sem fornecedor',
        totalSales: 0,
        revenue: 0,
        salesCount: 0,
        prices: []
      }
    }
    
    productStats[productId].totalSales += item.quantity || 0
    productStats[productId].revenue += (item.quantity || 0) * (item.price || 0)
    productStats[productId].salesCount += 1
    productStats[productId].prices.push(item.price || 0)
  })
  
  return Object.values(productStats)
    .map((product: any) => ({
      ...product,
      averagePrice: product.prices.length > 0 
        ? product.prices.reduce((sum: number, price: number) => sum + price, 0) / product.prices.length 
        : 0,
      lastSale: new Date().toISOString()
    }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
}

function processDetailedProducts(productSales: any[]) {
  const productStats: { [key: string]: any } = {}
  
  productSales.forEach(item => {
    const productId = item.product_id
    
    if (!productStats[productId]) {
      productStats[productId] = {
        id: productId,
        name: item.products?.name || 'Produto sem nome',
        category: item.products?.category || 'Sem categoria',
        supplier: item.products?.suppliers?.name || 'Sem fornecedor',
        totalSales: 0,
        revenue: 0,
        salesCount: 0,
        prices: [],
        lastSale: null
      }
    }
    
    productStats[productId].totalSales += item.quantity || 0
    productStats[productId].revenue += (item.quantity || 0) * (item.price || 0)
    productStats[productId].salesCount += 1
    productStats[productId].prices.push(item.price || 0)
    
    if (!productStats[productId].lastSale || new Date(item.orders.created_at) > new Date(productStats[productId].lastSale)) {
      productStats[productId].lastSale = item.orders.created_at
    }
  })
  
  return Object.values(productStats)
    .map((product: any) => ({
      ...product,
      averagePrice: product.prices.length > 0 
        ? product.prices.reduce((sum: number, price: number) => sum + price, 0) / product.prices.length 
        : 0
    }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
}

function processTopCustomers(customerOrders: any[]) {
  const customerStats: { [key: string]: any } = {}
  
  customerOrders.forEach(order => {
    const customerId = order.customer_id
    
    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        id: customerId,
        name: order.customers?.name || 'Cliente sem nome',
        email: order.customers?.email || 'Sem email',
        totalPurchases: 0,
        totalSpent: 0,
        registrationDate: order.customers?.created_at || order.created_at,
        lastPurchase: null,
        status: 'active',
        city: order.customers?.city || 'Não informado',
        state: order.customers?.state || 'Não informado'
      }
    }
    
    customerStats[customerId].totalPurchases += 1
    customerStats[customerId].totalSpent += order.total_amount || 0
    
    if (!customerStats[customerId].lastPurchase || new Date(order.created_at) > new Date(customerStats[customerId].lastPurchase)) {
      customerStats[customerId].lastPurchase = order.created_at
    }
  })
  
  return Object.values(customerStats)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
}

function processCategoryData(products: any[]) {
  const categoryCount: { [key: string]: number } = {}
  
  products.forEach(product => {
    const category = product.category || 'Outros'
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })
  
  const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0)
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
  
  return Object.entries(categoryCount)
    .map(([name, count], index) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value)
}

function processAnalyticsData(orders: any[]) {
  // Calcular métricas avançadas
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const totalOrders = orders.length
  const uniqueCustomers = new Set(orders.map(order => order.customer_id)).size
  
  // Calcular LTV médio
  const customerSpending: { [key: string]: number } = {}
  orders.forEach(order => {
    const customerId = order.customer_id
    customerSpending[customerId] = (customerSpending[customerId] || 0) + (order.total_amount || 0)
  })
  
  const avgLTV = uniqueCustomers > 0 
    ? Object.values(customerSpending).reduce((sum, spending) => sum + spending, 0) / uniqueCustomers 
    : 0
  
  // Calcular compras por cliente
  const customerOrders: { [key: string]: number } = {}
  orders.forEach(order => {
    const customerId = order.customer_id
    customerOrders[customerId] = (customerOrders[customerId] || 0) + 1
  })
  
  const avgOrdersPerCustomer = uniqueCustomers > 0 
    ? Object.values(customerOrders).reduce((sum, count) => sum + count, 0) / uniqueCustomers 
    : 0
  
  return {
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    averageLTV: avgLTV,
    averageOrdersPerCustomer: avgOrdersPerCustomer,
    conversionMetrics: {
      repeatCustomerRate: uniqueCustomers > 0 
        ? (Object.values(customerOrders).filter(count => count > 1).length / uniqueCustomers) * 100 
        : 0
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'export_report':
        return await exportReport(data)
      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro ao processar requisição POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function exportReport(data: any) {
  try {
    // Implementar lógica de exportação
    // Por enquanto, retornar dados formatados para download
    return NextResponse.json({
      success: true,
      downloadUrl: '/api/reports/export/' + Date.now(),
      message: 'Relatório preparado para exportação'
    })
  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    throw error
  }
}
