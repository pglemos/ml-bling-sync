from scripts.utils import supabase
from datetime import datetime, timezone

def add_test_products():
    """Adiciona produtos de teste com ml_item_id para demonstrar a sincronização"""
    
    # Produtos de teste com ml_item_id reais do Mercado Livre
    test_products = [
        {
            "id": 1001,
            "sku": "TEST-001",
            "nome": "iPhone 15 Pro Max 256GB",
            "ml_item_id": "MLB1234567890",  # ID fictício para teste
            "preco": 8999.00
        },
        {
            "id": 1002,
            "sku": "TEST-002", 
            "nome": "MacBook Air M3 512GB",
            "ml_item_id": "MLB0987654321",  # ID fictício para teste
            "preco": 12999.00
        },
        {
            "id": 1003,
            "sku": "TEST-003",
            "nome": "iPad Pro 12.9\" 1TB", 
            "ml_item_id": "MLB1122334455",  # ID fictício para teste
            "preco": 7499.00
        }
    ]
    
    try:
        print("📦 Adicionando produtos de teste...")
        
        for product in test_products:
            # Verificar se o produto já existe
            existing = supabase.table('products').select('id').eq('sku', product['sku']).execute()
            
            if existing.data:
                print(f"⚠️ Produto {product['sku']} já existe. Pulando...")
                continue
                
            # Adicionar produto
            product_data = {
                **product,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = supabase.table('products').insert(product_data).execute()
            
            if result.data:
                print(f"✅ Produto {product['sku']} adicionado com sucesso!")
            else:
                print(f"❌ Erro ao adicionar produto {product['sku']}")
                
    except Exception as e:
        print(f"❌ Erro ao adicionar produtos de teste: {e}")

if __name__ == "__main__":
    add_test_products()
