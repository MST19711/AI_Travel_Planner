from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..middleware import get_current_active_user

router = APIRouter(prefix="/trips", tags=["行程"])


@router.get("/", response_model=schemas.ListResponse)
async def get_trips(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="行程状态过滤"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取用户行程列表"""
    # 构建查询
    query = db.query(models.Trip).filter(models.Trip.user_id == current_user.id)

    # 状态过滤
    if status:
        query = query.filter(models.Trip.status == status)

    # 计算总数
    total = query.count()

    # 分页查询
    trips = (
        query.order_by(models.Trip.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 将SQLAlchemy对象转换为Pydantic模型
    trip_responses = [schemas.TripResponse.from_orm(trip) for trip in trips]

    # 计算总页数
    pages = (total + size - 1) // size

    return schemas.ListResponse(
        items=trip_responses, total=total, page=page, size=size, pages=pages
    )


@router.post("/", response_model=schemas.TripResponse)
async def create_trip(
    trip_data: schemas.TripCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """创建新行程 - 存储明文数据"""
    # 创建行程
    db_trip = models.Trip(
        title=trip_data.title,
        trip_data=trip_data.trip_data,
        user_id=current_user.id,
    )

    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    return db_trip


@router.get("/{trip_id}", response_model=schemas.TripResponse)
async def get_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取特定行程详情"""
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")

    return trip


@router.put("/{trip_id}", response_model=schemas.TripResponse)
async def update_trip(
    trip_id: int,
    trip_data: schemas.TripUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """更新行程 - 只更新加密数据"""
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")

    # 更新行程信息，不进行业务逻辑验证
    update_data = trip_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)

    return trip


@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """删除行程"""
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="行程不存在")

    db.delete(trip)
    db.commit()

    return {"message": "行程删除成功"}
