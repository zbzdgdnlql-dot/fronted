"""一键启动前端开发服务器（内置 Mock 数据，无需启动后端）

模拟账号（密码统一为 123456，登录时需选择对应的「用户类型」，学校任选）：
    管理员   账号 admin     用户类型「管理员」
    教师     账号 teacher   用户类型「教师」
    学生     账号 student   用户类型「学生」
"""
import os
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PORTS = (5173, 5174, 5175)

ACCOUNTS = [
    ("管理员", "admin", "123456"),
    ("教师", "teacher", "123456"),
    ("学生", "student", "123456"),
]


def patch_console():
    """避免中文在部分 Windows 控制台输出时报编码错误"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def print_accounts():
    print("\n模拟账号（登录时请选择对应的用户类型，学校任选）：")
    for role, name, pwd in ACCOUNTS:
        print("  {:<4}账号 {:<10}密码 {}".format(role, name, pwd))
    print()


def ensure_deps():
    if os.path.isdir(os.path.join(ROOT, "node_modules")):
        print("[1/2] 依赖已就绪")
        return True
    print("[1/2] 未检测到 node_modules，正在执行 npm install（首次较慢）...")
    return subprocess.run("npm install", cwd=ROOT, shell=True).returncode == 0


def find_free_port():
    """返回第一个空闲端口（vite 会从 5173 起依次尝试），全部被占用时返回 None"""
    for port in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return None


def wait_server(port, timeout=90):
    """轮询等待 dev server 就绪，返回可访问的地址；超时返回 None"""
    url = "http://127.0.0.1:{}".format(port)
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1)
            return url
        except Exception:
            time.sleep(0.5)
    return None


def kill_tree(proc):
    if proc.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            "taskkill /F /T /PID {}".format(proc.pid),
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        proc.terminate()


def main():
    patch_console()
    os.chdir(ROOT)
    print_accounts()

    if not ensure_deps():
        print("依赖安装失败，请手动执行 npm install 后重试。")
        return 1

    port = find_free_port()
    if port is None:
        print("端口 {} 均被占用，请先关闭占用进程后重试。".format("/".join(map(str, PORTS))))
        return 1
    if port != PORTS[0]:
        print("提示：端口 {} 已被占用，本次将使用 {}".format(PORTS[0], port))

    print("[2/2] 启动 Vite 开发服务器（Ctrl+C 退出）...\n")
    proc = subprocess.Popen("npm run dev", cwd=ROOT, shell=True)
    try:
        url = wait_server(port)
        if url:
            print("\n服务已就绪 → {}（已自动打开浏览器）".format(url))
            webbrowser.open(url)
        else:
            print("\n等待超时，请查看上方日志确认端口后手动访问 http://127.0.0.1:{}".format(port))
        proc.wait()
    except KeyboardInterrupt:
        print("\n正在关闭开发服务器...")
    finally:
        kill_tree(proc)
    return 0


if __name__ == "__main__":
    sys.exit(main())
