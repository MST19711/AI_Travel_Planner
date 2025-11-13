from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """用户模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    
    # SRP认证相关字段（必需）
    srp_salt = Column(String(255), nullable=False)  # SRP盐值
    srp_verifier = Column(String(255), nullable=False)  # SRP验证器
    
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
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")


class Trip(Base):
    """行程模型 - 存储加密的行程数据"""
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)  # 行程标题（明文，用于快速显示）
    
    # 行程状态（明文，用于快速过滤）
    status = Column(String(20), default="planning")  # planning, in_progress, completed, cancelled
    
    # 加密的行程数据（包含所有行程详情，前端负责加密解密）
    encrypted_data = Column(Text, nullable=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    user = relationship("User", back_populates="trips")
    activities = relationship("Activity", back_populates="trip", cascade="all, delete-orphan")


class Activity(Base):
    """子行程活动模型"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False)  # 第几天
    activity_date = Column(DateTime(timezone=True), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    start_time = Column(String(10), nullable=True)  # HH:MM格式
    end_time = Column(String(10), nullable=True)    # HH:MM格式
    cost_estimate = Column(Integer, nullable=True)  # 预估费用（单位：元）
    category = Column(String(50), nullable=True)    # 活动类别（餐饮、景点、交通等）
    
    # 是否已完成
    completed = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    trip = relationship("Trip", back_populates="activities")