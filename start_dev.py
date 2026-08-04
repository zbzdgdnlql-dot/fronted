"""临时启动前端开发服务器并打开浏览器"""
import subprocess
import webbrowser
import time
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("[1/2] 检查依赖...")
if not os.path.exists("node_modules"):
    print("  node_modules 不存在，正在安装依赖...")
    subprocess.run("npm install", shell=True, check=True)
else:
    print("  依赖已就绪")

print("[2/2] 启动 Vite 开发服务器...")
# Vite 默认端口 5173
url = "http://localhost:5173"

proc = subprocess.Popen(
    "npx vite --host",
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    shell=True,
)

time.sleep(2)
print(f"  打开浏览器 → {url}")
webbrowser.open(url)

print("\n服务已启动，按 Ctrl+C 退出。\n")
try:
    for line in proc.stdout:
        print(line, end="")
except KeyboardInterrupt:
    print("\n正在关闭...")
    proc.terminate()
    sys.exit(0)
