#!/usr/bin/env python3
import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description='启动排班API服务')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='服务主机地址')
    parser.add_argument('--port', type=int, default=5001, help='服务端口')
    parser.add_argument('--debug', action='store_true', help='是否启用调试模式')
    
    args = parser.parse_args()
    
    # 导入API模块
    from roster_api import app
    
    # 启动服务
    app.run(host=args.host, port=args.port, debug=args.debug)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())