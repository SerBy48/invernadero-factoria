"""
Script de importación automática de historias de usuario a Taiga.
Uso: python taiga_import.py --url https://taiga.io --token TOKEN --project-slug invernadero
"""
import argparse
import json
import sys

try:
    import requests
except ImportError:
    print("Instala requests: pip install requests")
    sys.exit(1)


def importar(base_url, token, project_slug, historias_file):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "x-disable-pagination": "true"
    }

    # Obtener ID del proyecto
    r = requests.get(f"{base_url}/api/v1/projects/by_slug?slug={project_slug}",
                     headers=headers)
    r.raise_for_status()
    project_id = r.json()["id"]
    print(f"✔ Proyecto encontrado: {project_id}")

    with open(historias_file, encoding="utf-8") as f:
        data = json.load(f)

    creadas = 0
    for h in data["historias"]:
        payload = {
            "project": project_id,
            "subject": h["titulo"],
            "description": h["descripcion"],
        }
        resp = requests.post(f"{base_url}/api/v1/userstories",
                             headers=headers, json=payload)
        if resp.status_code in (200, 201):
            creadas += 1
            print(f"  ✔ Historia creada: {h['titulo']}")
        else:
            print(f"  ✗ Error en '{h['titulo']}': {resp.text[:100]}")

    print(f"\n{creadas}/{len(data['historias'])} historias importadas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url",           default="https://taiga.io")
    parser.add_argument("--token",         required=True)
    parser.add_argument("--project-slug",  required=True)
    parser.add_argument("--historias",     default="historias_usuario.json")
    args = parser.parse_args()

    importar(args.url, args.token, args.project_slug, args.historias)
