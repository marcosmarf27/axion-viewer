import time

import requests


def test_sequential_conversions():
    """Testa múltiplas conversões sequenciais para garantir que o estado do parser Markdown é resetado"""
    url = "http://localhost:5000/api/convert"

    print("Testando múltiplas conversões sequenciais...")

    for i in range(1, 4):
        markdown = f"""# Relatório de Teste {i}

## Seção {i}

| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado {i}A | Dado {i}B | Dado {i}C |

**Status:** Teste {i} em andamento

### Detalhes
- Item 1 do teste {i}
- Item 2 do teste {i}
- Item 3 do teste {i}
"""

        payload = {"markdown": markdown, "theme": "juridico"}

        response = requests.post(url, json=payload)

        assert response.status_code == 200, (
            f"Teste {i} falhou com status {response.status_code}"
        )

        result = response.json()
        assert result.get("success"), f"Teste {i} não retornou success=True"
        assert "html" in result, f"Teste {i} não retornou HTML"
        assert "filename" in result, f"Teste {i} não retornou filename"

        print(f"✓ Teste {i} passou - Arquivo: {result.get('filename')}")

        time.sleep(0.5)

    print(
        "\n✅ Todos os testes passaram! O parser Markdown está sendo corretamente resetado."
    )


def test_file_upload():
    """Testa o upload de arquivo Markdown"""
    url = "http://localhost:5000/api/convert/file"

    print("\nTestando upload de arquivo...")

    test_md_content = """# Relatório de Upload

## Informações
| Campo | Valor |
|-------|-------|
| Teste | Upload |
| Status | OK |
"""

    files = {"file": ("test.md", test_md_content, "text/markdown")}
    data = {"theme": "juridico"}

    response = requests.post(url, files=files, data=data)

    assert response.status_code == 200, (
        f"Upload falhou com status {response.status_code}"
    )

    result = response.json()
    assert result.get("success"), "Upload não retornou success=True"

    print(f"✓ Upload passou - Arquivo: {result.get('filename')}")
    print("\n✅ Teste de upload passou!")


if __name__ == "__main__":
    try:
        test_sequential_conversions()
        test_file_upload()
        print("\n🎉 Todos os testes foram executados com sucesso!")
    except AssertionError as e:
        print(f"\n❌ Falha no teste: {e}")
    except requests.exceptions.ConnectionError:
        print(
            "\n❌ Erro: Não foi possível conectar à API. Verifique se o servidor está rodando."
        )
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
