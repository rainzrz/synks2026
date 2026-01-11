# Teste Rápido do Status Check
# Execute: python test_status_check.py

from simple_status_check import simple_check_link_status
import time

# Lista de URLs para testar
test_urls = [
    "https://google.com",
    "https://github.com",
    "http://localhost:8000",
    "https://site-que-nao-existe-12345.com",
    "http://192.168.1.1",  # Router local (pode ou não responder)
]

print("=" * 60)
print("TESTE DE STATUS CHECK - PING/TELNET")
print("=" * 60)
print()

for url in test_urls:
    print(f"🔍 Testando: {url}")
    print(f"   Aguarde...")

    start = time.time()
    result = simple_check_link_status(url)
    elapsed = time.time() - start

    status_emoji = "✅" if result['status'] == 'online' else "❌"

    print(f"   {status_emoji} Status: {result['status'].upper()}")
    print(f"   ⏱️  Tempo: {result['response_time']}ms")
    print(f"   🔧 Método: {result['method']}")

    if 'error' in result:
        print(f"   ⚠️  Erro: {result['error']}")

    print(f"   📊 Tempo total: {int(elapsed * 1000)}ms")
    print()

print("=" * 60)
print("TESTE CONCLUÍDO!")
print("=" * 60)
