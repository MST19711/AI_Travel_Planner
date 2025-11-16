#!/usr/bin/env python3
"""
数据库表创建脚本
在容器启动时用于初始化数据库
"""

import os
import sys

# 添加应用路径到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import Base


def create_tables():
    """创建所有数据库表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成")


if __name__ == "__main__":
    create_tables()
