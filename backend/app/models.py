from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

# 使用标准SQLAlchemy类型而不是自定义类型
from sqlalchemy import String, Text


class User(Base):
    """用户模型"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    userID = Column(
        Integer, unique=True, index=True, nullable=False
    )  # 用户ID，按照用户数量自动生成
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)

    # SRP认证相关字段（可选，用于SRP认证）
    srp_salt = Column(Text, nullable=True)  # SRP盐值 (Base64编码)
    srp_verifier = Column(Text, nullable=True)  # SRP验证器（Base64编码的大整数）

    # 不安全密码传输相关字段（可选）
    insecure_password_hash = Column(String(64), nullable=True)  # 密码hash (SHA256)
    is_insecure_auth = Column(Boolean, default=False)  # 是否使用不安全密码传输

    # API密钥配置（使用AES加密存储）
    openai_api_key = Column(String(255), nullable=True)
    openai_base_url = Column(String(255), nullable=True)
    openai_model = Column(String(50), nullable=True)
    amap_api_key = Column(String(255), nullable=True)
    xunfei_app_id = Column(String(255), nullable=True)
    xunfei_api_secret = Column(String(255), nullable=True)
    xunfei_api_key = Column(String(255), nullable=True)
    glm_api_key = Column(String(255), nullable=True)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 关系
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")


class Trip(Base):
    """行程模型 - 存储明文的行程数据"""

    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)  # 行程标题

    # 行程状态
    status = Column(
        String(20), default="planning"
    )  # planning, in_progress, completed, cancelled

    # 行程数据（JSON格式，包含所有行程详情）
    trip_data = Column(JSON, nullable=False)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 关系
    user = relationship("User", back_populates="trips")
