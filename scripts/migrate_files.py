#!/usr/bin/env python3
"""Script de migracao de arquivos locais (data/outputs/) para Supabase Storage.

Cria hierarquia placeholder no banco de dados e faz upload de cada arquivo,
registrando-o na tabela documentos.

Uso:
    python scripts/migrate_files.py

Em producao (Railway):
    railway run python scripts/migrate_files.py
"""

import os
import sys

# Garantir que o diretorio raiz do projeto esta no path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from utils.supabase_client import supa_service


def migrate():
    output_folder = Config.OUTPUT_FOLDER

    if not os.path.isdir(output_folder):
        print(f"Diretorio nao encontrado: {output_folder}")
        return

    files = sorted(
        f
        for f in os.listdir(output_folder)
        if os.path.isfile(os.path.join(output_folder, f))
        and f.endswith((".html", ".pdf"))
    )

    if not files:
        print("Nenhum arquivo para migrar.")
        return

    print(f"Encontrados {len(files)} arquivo(s) para migrar.")

    # Criar hierarquia placeholder
    print("Criando hierarquia placeholder...")
    cliente = supa_service.create_cliente(
        {"nome": "Documentos Migrados", "tipo": "PJ", "status": "ativo"}
    ).data[0]
    print(f"  Cliente: {cliente['id']}")

    carteira = supa_service.create_carteira(
        {
            "nome": "Migracao Automatica",
            "cliente_id": cliente["id"],
            "status": "ativa",
        }
    ).data[0]
    print(f"  Carteira: {carteira['id']}")

    caso = supa_service.create_caso(
        {
            "nome": "Documentos Pre-Migracao",
            "carteira_id": carteira["id"],
            "status": "em_andamento",
        }
    ).data[0]
    print(f"  Caso: {caso['id']}")

    processo = supa_service.create_processo(
        {
            "numero_cnj": "0000000-00.0000.0.00.0000",
            "caso_id": caso["id"],
            "tipo_acao": "Migracao",
            "status": "ativo",
        }
    ).data[0]
    print(f"  Processo: {processo['id']}")

    # Migrar cada arquivo
    print("\nIniciando migracao dos arquivos...")
    success = 0
    errors = 0

    for filename in files:
        filepath = os.path.join(output_folder, filename)
        file_type = "pdf" if filename.endswith(".pdf") else "html"

        try:
            with open(filepath, "rb") as f:
                content = f.read()

            storage_path = supa_service.upload_file(content, file_type)

            supa_service.create_documento(
                {
                    "processo_id": processo["id"],
                    "filename": filename,
                    "original_name": filename,
                    "file_type": file_type,
                    "storage_path": storage_path,
                    "file_size": len(content),
                    "title": filename.rsplit(".", 1)[0],
                }
            )

            print(f"  OK: {filename} -> {storage_path}")
            success += 1

        except Exception as e:
            print(f"  ERRO: {filename} - {e}")
            errors += 1

    # Report
    print(f"\n{'=' * 50}")
    print("Migracao concluida!")
    print(f"  Sucesso: {success}")
    print(f"  Erros:   {errors}")
    print(f"  Total:   {len(files)}")
    print("\nArquivos locais NAO foram deletados (backup).")


if __name__ == "__main__":
    migrate()
