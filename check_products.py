from scripts.utils import supabase

def check_products():
    try:
        res = supabase.table('products').select('*').execute()
        products = res.data or []
        
        print(f"📊 Total de produtos na base: {len(products)}")
        
        if products:
            print("\n📋 Primeiros 5 produtos:")
            for i, p in enumerate(products[:5]):
                sku = p.get('sku', p.get('id'))
                ml_item_id = p.get('ml_item_id', 'sem item_id')
                print(f"  {i+1}. {sku}: {ml_item_id}")
        else:
            print("❌ Nenhum produto encontrado na base de dados")
            
    except Exception as e:
        print(f"❌ Erro ao verificar produtos: {e}")

if __name__ == "__main__":
    check_products()
