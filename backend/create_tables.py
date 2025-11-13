#!/usr/bin/env python3
"""
数据库表创建脚本
运行此脚本创建所有数据库表
"""

import os
import sys

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import Base


def create_tables():
    """创建所有数据库表"""
    print("正在创建数据库表...")
    
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("✅ 数据库表创建成功！")
        
        # 显示创建的表
        tables = Base.metadata.tables.keys()
        print(f"✅ 已创建的表: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ 创建数据库表时出错: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_tables()