import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'customers':
        return await getCustomers(supabase)
      case 'invoices':
        return await getInvoices(supabase)
      case 'plans':
        return await getPlans(supabase)
      case 'metrics':
        return await getMetrics(supabase)
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Billing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getCustomers(supabase: any) {
  // Buscar usuários com informações de assinatura
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      phone,
      company,
      role,
      created_at,
      tenant:tenants(
        id,
        name,
        subscription:subscriptions(
          id,
          status,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          plan:plans(
            id,
            name,
            price_cents,
            interval
          )
        )
      )
    `)
    .eq('role', 'Admin')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching customers:', usersError)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }

  // Transformar dados para o formato esperado pelo frontend
  const customers = users?.map(user => {
    const subscription = user.tenant?.subscription?.[0]
    const plan = subscription?.plan
    
    return {
      id: user.id,
      name: user.name || 'N/A',
      email: user.email,
      phone: user.phone || '',
      company: user.company || user.tenant?.name || 'N/A',
      plan: plan?.name?.toLowerCase() || 'basic',
      status: getSubscriptionStatus(subscription),
      monthlyFee: plan?.price_cents ? plan.price_cents / 100 : 0,
      nextBilling: subscription?.current_period_end || '',
      lastPayment: subscription?.current_period_start || '',
      paymentMethod: 'Cartão de Crédito', // Default - pode ser expandido
      totalRevenue: calculateTotalRevenue(subscription, plan),
      joinDate: user.created_at,
      daysOverdue: calculateDaysOverdue(subscription)
    }
  }) || []

  return NextResponse.json({ customers })
}

async function getInvoices(supabase: any) {
  // Buscar faturas do banco
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total_cents,
      status,
      due_date,
      paid_at,
      line_items,
      created_at,
      subscription:subscriptions(
        id,
        tenant:tenants(
          id,
          name,
          users(
            name,
            email
          )
        ),
        plan:plans(
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }

  // Transformar dados para o formato esperado pelo frontend
  const transformedInvoices = invoices?.map(invoice => {
    const customer = invoice.subscription?.tenant?.users?.[0]
    const plan = invoice.subscription?.plan
    
    return {
      id: invoice.invoice_number || invoice.id,
      customerId: invoice.subscription?.tenant?.id || '',
      customerName: customer?.name || 'N/A',
      amount: invoice.total_cents / 100,
      status: invoice.status,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_at,
      description: `Plano ${plan?.name || 'N/A'} - ${new Date(invoice.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      plan: plan?.name || 'N/A',
      paymentMethod: 'Cartão de Crédito', // Default
      createdAt: invoice.created_at
    }
  }) || []

  return NextResponse.json({ invoices: transformedInvoices })
}

async function getPlans(supabase: any) {
  // Buscar planos do banco
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('sort_order', { ascending: true })

  if (plansError) {
    console.error('Error fetching plans:', plansError)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }

  // Transformar dados para o formato esperado pelo frontend
  const transformedPlans = plans?.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price_cents / 100,
    features: extractFeatures(plan.features),
    maxProducts: plan.quotas?.products || 1000,
    maxOrders: plan.quotas?.orders_per_month || 500,
    support: getSupportLevel(plan.features),
    popular: plan.is_popular
  })) || []

  return NextResponse.json({ plans: transformedPlans })
}

async function getMetrics(supabase: any) {
  // Buscar métricas de faturamento
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      plan:plans(
        price_cents
      )
    `)
    .eq('status', 'ACTIVE')

  if (subscriptionsError) {
    console.error('Error fetching metrics:', subscriptionsError)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }

  // Buscar faturas vencidas
  const { data: overdueInvoices, error: overdueError } = await supabase
    .from('invoices')
    .select('total_cents')
    .eq('status', 'overdue')

  if (overdueError) {
    console.error('Error fetching overdue invoices:', overdueError)
  }

  // Calcular métricas
  const totalRevenue = subscriptions?.reduce((sum, sub) => {
    const monthsActive = calculateMonthsActive(sub.current_period_start)
    return sum + (sub.plan?.price_cents || 0) * monthsActive
  }, 0) || 0

  const monthlyRecurring = subscriptions?.reduce((sum, sub) => {
    return sum + (sub.plan?.price_cents || 0)
  }, 0) || 0

  const overdueAmount = overdueInvoices?.reduce((sum, invoice) => {
    return sum + (invoice.total_cents || 0)
  }, 0) || 0

  const activeCustomers = subscriptions?.length || 0

  return NextResponse.json({
    metrics: {
      totalRevenue: totalRevenue / 100,
      monthlyRecurring: monthlyRecurring / 100,
      overdueAmount: overdueAmount / 100,
      activeCustomers
    }
  })
}

// Funções auxiliares
function getSubscriptionStatus(subscription: any) {
  if (!subscription) return 'trial'
  
  switch (subscription.status) {
    case 'ACTIVE':
      return 'active'
    case 'CANCELED':
      return 'cancelled'
    case 'PAST_DUE':
      return 'suspended'
    case 'TRIALING':
      return 'trial'
    default:
      return 'active'
  }
}

function calculateTotalRevenue(subscription: any, plan: any) {
  if (!subscription || !plan) return 0
  
  const monthsActive = calculateMonthsActive(subscription.current_period_start)
  return (plan.price_cents / 100) * monthsActive
}

function calculateMonthsActive(startDate: string) {
  if (!startDate) return 0
  
  const start = new Date(startDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - start.getTime())
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
  return Math.max(1, diffMonths)
}

function calculateDaysOverdue(subscription: any) {
  if (!subscription || subscription.status !== 'PAST_DUE') return 0
  
  const endDate = new Date(subscription.current_period_end)
  const now = new Date()
  const diffTime = now.getTime() - endDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

function extractFeatures(features: any) {
  if (!features) return []
  
  const featureList = []
  if (features.basic_sync) featureList.push('Sincronização básica')
  if (features.api_access) featureList.push('Acesso à API')
  if (features.advanced_analytics) featureList.push('Relatórios avançados')
  if (features.priority_support) featureList.push('Suporte prioritário')
  if (features.white_label) featureList.push('White label')
  if (features.custom_integrations) featureList.push('Integrações customizadas')
  if (features.dedicated_support) featureList.push('Suporte dedicado')
  
  return featureList
}

function getSupportLevel(features: any) {
  if (!features) return 'Email'
  
  if (features.dedicated_support) return '24/7 Dedicado'
  if (features.priority_support) return 'Chat + Email'
  return 'Email'
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'create_invoice':
        return await createInvoice(supabase, data)
      case 'update_plan':
        return await updatePlan(supabase, data)
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Billing POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createInvoice(supabase: any, data: any) {
  const { customerId, amount, dueDate, description } = data
  
  // Buscar subscription do cliente
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('tenant_id', customerId)
    .eq('status', 'ACTIVE')
    .single()

  if (subError || !subscription) {
    return NextResponse.json({ error: 'Customer subscription not found' }, { status: 404 })
  }

  // Gerar número da fatura
  const invoiceNumber = `INV-${Date.now()}`
  
  // Criar fatura
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      tenant_id: customerId,
      subscription_id: subscription.id,
      total_cents: Math.round(amount * 100),
      subtotal_cents: Math.round(amount * 100),
      status: 'OPEN',
      due_date: dueDate,
      line_items: [{
        description,
        quantity: 1,
        unit_amount_cents: Math.round(amount * 100),
        total_amount_cents: Math.round(amount * 100)
      }]
    })
    .select()
    .single()

  if (invoiceError) {
    console.error('Error creating invoice:', invoiceError)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }

  return NextResponse.json({ invoice })
}

async function updatePlan(supabase: any, data: any) {
  const { planId, updates } = data
  
  // Atualizar plano
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .update({
      name: updates.name,
      description: updates.description,
      price_cents: Math.round(updates.price * 100),
      features: updates.features,
      quotas: updates.quotas,
      is_popular: updates.popular
    })
    .eq('id', planId)
    .select()
    .single()

  if (planError) {
    console.error('Error updating plan:', planError)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }

  return NextResponse.json({ plan })
}
