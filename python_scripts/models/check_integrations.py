from scripts.utils import supabase

def check_integrations():
    try:
        res = supabase.table('integrations').select('*').execute()
        integrations = res.data or []
        
        print(f"🔗 Total de integrações na base: {len(integrations)}")
        
        if integrations:
            print("\n📋 Integrações configuradas:")
            for i, integration in enumerate(integrations):
                provider = integration.get('provider', 'N/A')
                user_id = integration.get('user_id', 'N/A')
                created_at = integration.get('created_at', 'N/A')
                print(f"  {i+1}. {provider} (user: {user_id}) - {created_at}")
        else:
            print("❌ Nenhuma integração encontrada na base de dados")
            
    except Exception as e:
        print(f"❌ Erro ao verificar integrações: {e}")

if __name__ == "__main__":
    check_integrations()
