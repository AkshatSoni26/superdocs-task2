from fastapi import APIRouter, HTTPException, responses
from app.schemas.superdocs import (
    SuperDocsChatRequest,
    SuperDocsChatResponse,
    SuperDocsApproveRequest,
    SuperDocsExportResponse,
)
from app.services.superdocs_service import SuperDocsClientService

router = APIRouter(prefix="/superdocs", tags=["SuperDocs Integration"])


@router.post("/chat", response_model=SuperDocsChatResponse)
async def send_chat(payload: SuperDocsChatRequest):
    """Send targeted edit instruction to SuperDocs (returns diff cards with 2-step JSON parse)."""
    client = SuperDocsClientService()
    try:
        res = await client.send_chat_instruction(payload)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SuperDocs chat failed: {str(e)}")


@router.post("/approve")
async def approve_diffs(payload: SuperDocsApproveRequest):
    """Approve or reject proposed SuperDocs diffs."""
    client = SuperDocsClientService()
    try:
        ok = await client.approve_changes(payload)
        return {"status": "success", "approved": ok}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SuperDocs approval failed: {str(e)}")


@router.get("/export/{document_id}", response_model=SuperDocsExportResponse)
async def export_doc(document_id: str, format: str = "pdf"):
    """Export finalized document from SuperDocs."""
    client = SuperDocsClientService()
    try:
        res = await client.export_document(document_id, format_type=format)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SuperDocs export failed: {str(e)}")


@router.get("/download/{document_name}")
async def download_mock_file(document_name: str):
    """Serve mock generated document export."""
    mock_content = f"# SuperDocs Document Export\n\nFile: {document_name}\nStatus: Certified and Exported."
    return responses.Response(
        content=mock_content.encode("utf-8"),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{document_name}"'}
    )
