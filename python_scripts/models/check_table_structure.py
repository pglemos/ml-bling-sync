from scripts.utils import supabase

def check_table_structure():
    """Verifica a estrutura da tabela products"""
    try:
        # Tentar buscar uma linha para ver as colunas disponíveis
        res = supabase.table('products').select('*').limit(1).execute()
        
        if res.data:
            print("📋 Estrutura da tabela products (baseada em uma linha existente):")
            for key, value in res.data[0].items():
                print(f"  - {key}: {type(value).__name__}")
        else:
            print("📋 Tabela products está vazia. Tentando inserir um registro de teste...")
            
            # Tentar inserir um registro mínimo
            test_data = {
                "id": 999999,  # ID numérico
                "sku": "TEST-MIN",
                "created_at": "2025-01-27T00:00:00Z",
                "updated_at": "2025-01-27T00:00:00Z"
            }
            
            result = supabase.table('products').insert(test_data).execute()
            
            if result.data:
                print("✅ Registro de teste inserido com sucesso!")
                print("📋 Estrutura da tabela products:")
                for key, value in result.data[0].items():
                    print(f"  - {key}: {type(value).__name__}")
                    
                # Remover o registro de teste
                supabase.table('products').delete().eq('sku', 'TEST-MIN').execute()
                print("🗑️ Registro de teste removido.")
            else:
                print("❌ Erro ao inserir registro de teste")
                
    except Exception as e:
        print(f"❌ Erro ao verificar estrutura da tabela: {e}")

if __name__ == "__main__":
    check_table_structure()
