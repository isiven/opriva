#!/usr/bin/env python3
"""
Opriva Agent Notifier — WhatsApp via CallMeBot
Llamado manualmente por Claude Code después de crear un PR.

SETUP INICIAL:
  1. Ve a https://callmebot.com y copia el número actual del bot
  2. Agrega ese número como contacto en WhatsApp
  3. Mándale: "I allow callmebot to send me messages"
  4. Recibirás tu API key por WhatsApp
  5. Copia .env.example a .env y llena CALLMEBOT_PHONE y CALLMEBOT_APIKEY
  6. Verifica que .env está en .gitignore

IMPORTANTE:
El número de CallMeBot puede cambiar. Siempre verificar en callmebot.com.
Nunca subir .env a git.
"""

import argparse
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


def load_env():
    for candidate in [Path(__file__).parent.parent / ".env", Path.cwd() / ".env"]:
        if candidate.exists():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            break


def build_message(task, pr_url, summary, status):
    icon = "[OK]" if any(w in status.lower() for w in ["paso", "passed", "ok", "clean"]) else "[!]"
    parts = [
        f"{icon} *Opriva Agent* — listo para revisión",
        "",
        f"Tarea: *{task}*",
        f"Estado: {status}",
    ]
    if summary:
        parts.append(f"Cambios: {summary}")
    if pr_url:
        parts += ["", f"PR: {pr_url}"]
    parts += ["", "_Isaac revisa y aprueba. No mergear automáticamente._"]
    return "\n".join(parts)


def send_whatsapp(message, phone, apikey):
    encoded = urllib.parse.quote(message)
    url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded}&apikey={apikey}"
    print(f"Enviando WhatsApp a {phone[:5]}*****...")
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            body = r.read().decode("utf-8", errors="ignore")
            print("OK: Notificación enviada." if "Message Sent" in body or r.status == 200 else f"Respuesta: {body}")
    except Exception as e:
        print(f"Error al enviar: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    load_env()
    phone = os.environ.get("CALLMEBOT_PHONE", "")
    apikey = os.environ.get("CALLMEBOT_APIKEY", "")

    if not phone or not apikey:
        print(
            "\nError: faltan credenciales en .env\n"
            "Necesitas:\n"
            "  CALLMEBOT_PHONE=507XXXXXXXX\n"
            "  CALLMEBOT_APIKEY=TU_KEY\n"
            "\nGuía: https://callmebot.com\n",
            file=sys.stderr,
        )
        sys.exit(1)

    p = argparse.ArgumentParser()
    p.add_argument("--task", required=True)
    p.add_argument("--pr", default="")
    p.add_argument("--summary", default="")
    p.add_argument("--status", default="QA pasó · build limpio")
    args = p.parse_args()

    send_whatsapp(build_message(args.task, args.pr, args.summary, args.status), phone, apikey)


if __name__ == "__main__":
    main()
