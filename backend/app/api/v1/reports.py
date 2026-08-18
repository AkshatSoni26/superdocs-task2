from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.report import ProgrammeReportResponse
from app.services.aggregation_service import AggregationService

router = APIRouter(prefix="/reports", tags=["Executive Programme Reports"])


@router.get("/programme-summary", response_model=ProgrammeReportResponse)
async def get_programme_summary(
    cycle_year: int = 2026,
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregate ESG attestation statistics, risk profiles, pillar compliance averages,
    and chart data points for the executive dashboard and report.
    """
    service = AggregationService(db=db)
    try:
        metrics = await service.get_programme_metrics(cycle_year=cycle_year)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Aggregation failed: {str(e)}")
