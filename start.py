from scripts.create_missing_categorias import sync_categories
from scripts.sync_products import sync_products

def main():
    print("🚀 Iniciando sincronização...")

    # Passo 1 → Categorias
    try:
        print("📂 Sincronizando categorias...")
        sync_categories()
        print("✅ Categorias sincronizadas com sucesso!\n")
    except Exception as e:
        print("❌ Erro ao sincronizar categorias:", str(e))

    # Passo 2 → Produtos
    try:
        print("📦 Sincronizando produtos...")
        sync_products()
        print("✅ Produtos sincronizados com sucesso!\n")
    except Exception as e:
        print("❌ Erro ao sincronizar produtos:", str(e))

    print("🏁 Finalizado.")

if __name__ == "__main__":
    main()
