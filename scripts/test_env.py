from dotenv import load_dotenv
import os

load_dotenv()  # carrega o .env

print("NEXT_PUBLIC_SUPABASE_URL:", os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
print("SUPABASE_SERVICE_ROLE_KEY:", os.getenv("SUPABASE_SERVICE_ROLE_KEY")[:20] + "...")
