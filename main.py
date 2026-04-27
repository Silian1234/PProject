from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path
from shutil import which


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def npm_command() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def run_blocking(cmd: list[str], cwd: Path) -> None:
    print(f"[run] {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, cwd=str(cwd), check=True)


def terminate_process(proc: subprocess.Popen[str], name: str) -> None:
    if proc.poll() is not None:
        return
    print(f"[stop] {name}")
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)


def start_services(
    backend_host: str,
    backend_port: int,
    frontend_host: str,
    frontend_port: int,
    backend_only: bool,
    frontend_only: bool,
) -> int:
    processes: list[tuple[str, subprocess.Popen[str]]] = []
    try:
        if not frontend_only:
            backend_cmd = [
                sys.executable,
                "manage.py",
                "runserver",
                f"{backend_host}:{backend_port}",
            ]
            backend_env = os.environ.copy()
            backend_env["PYTHONUNBUFFERED"] = "1"
            backend_proc = subprocess.Popen(
                backend_cmd,
                cwd=str(BACKEND_DIR),
                env=backend_env,
                text=True,
            )
            processes.append(("backend", backend_proc))
            print(f"[ok] Backend started: http://{backend_host}:{backend_port}")

        if not backend_only:
            npm = npm_command()
            if which(npm) is None:
                raise RuntimeError("npm is not installed or not found in PATH.")
            frontend_cmd = [
                npm,
                "run",
                "dev",
                "--",
                "--host",
                frontend_host,
                "--port",
                str(frontend_port),
            ]
            frontend_proc = subprocess.Popen(
                frontend_cmd,
                cwd=str(FRONTEND_DIR),
                text=True,
            )
            processes.append(("frontend", frontend_proc))
            print(f"[ok] Frontend started: http://{frontend_host}:{frontend_port}")

        if not processes:
            print("[warn] Nothing to run. Use default mode or choose one of --backend-only / --frontend-only.")
            return 0

        print("[info] Press Ctrl+C to stop services.")
        while True:
            for name, proc in processes:
                code = proc.poll()
                if code is not None:
                    print(f"[error] {name} exited with code {code}.")
                    return code
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[info] Stopping services...")
        return 0
    finally:
        for name, proc in reversed(processes):
            terminate_process(proc, name)


def validate_dirs() -> None:
    if not (BACKEND_DIR / "manage.py").exists():
        raise FileNotFoundError(f"Backend entrypoint not found: {BACKEND_DIR / 'manage.py'}")
    if not (FRONTEND_DIR / "package.json").exists():
        raise FileNotFoundError(f"Frontend package.json not found: {FRONTEND_DIR / 'package.json'}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run PProject backend and frontend together.")
    parser.add_argument("--migrate", action="store_true", help="Run Django migrations before start.")
    parser.add_argument("--seed-demo", action="store_true", help="Run demo seed command before start.")
    parser.add_argument("--backend-only", action="store_true", help="Start only backend service.")
    parser.add_argument("--frontend-only", action="store_true", help="Start only frontend service.")
    parser.add_argument("--backend-host", default="127.0.0.1")
    parser.add_argument("--backend-port", type=int, default=8000)
    parser.add_argument("--frontend-host", default="127.0.0.1")
    parser.add_argument("--frontend-port", type=int, default=5173)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.backend_only and args.frontend_only:
        print("[error] Choose only one mode: --backend-only OR --frontend-only.")
        return 2

    validate_dirs()

    try:
        if args.migrate and not args.frontend_only:
            run_blocking([sys.executable, "manage.py", "migrate"], BACKEND_DIR)

        if args.seed_demo and not args.frontend_only:
            run_blocking([sys.executable, "manage.py", "seed_demo"], BACKEND_DIR)

        return start_services(
            backend_host=args.backend_host,
            backend_port=args.backend_port,
            frontend_host=args.frontend_host,
            frontend_port=args.frontend_port,
            backend_only=args.backend_only,
            frontend_only=args.frontend_only,
        )
    except subprocess.CalledProcessError as exc:
        print(f"[error] Command failed with code {exc.returncode}: {exc.cmd}")
        return exc.returncode
    except Exception as exc:  # noqa: BLE001
        print(f"[error] {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
