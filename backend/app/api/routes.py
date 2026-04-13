import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ArticlePayload, ArticleResponse, ArticleSave
from app.auth.utils import get_current_user
from app.database import get_db
from app.models.article import Article
from app.models.user import User
from app.pdf.builder import build_pdf

router = APIRouter(prefix="/api", tags=["articles"])


@router.post("/generate-pdf")
async def generate_pdf(
    payload: ArticlePayload,
    current_user: User = Depends(get_current_user),
):
    try:
        pdf_bytes, total_pages = build_pdf(payload.model_dump())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {exc}",
        )
    page_start = payload.pageStart or 1
    page_end = page_start + total_pages - 1
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=articulo_earl.pdf",
            "X-Page-End": str(page_end),
            "X-Total-Pages": str(total_pages),
        },
    )


@router.get("/articles", response_model=list[ArticleResponse])
async def list_articles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article)
        .where(Article.user_id == current_user.id)
        .order_by(Article.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/articles", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    body: ArticleSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    article = Article(
        user_id=current_user.id,
        title_es=body.title_es,
        title_en=body.data.titleEn or None,
        doc_type=body.doc_type,
        data=body.data.model_dump(),
        status=body.status,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article


@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(
            Article.id == article_id, Article.user_id == current_user.id
        )
    )
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: uuid.UUID,
    body: ArticleSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(
            Article.id == article_id, Article.user_id == current_user.id
        )
    )
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    article.title_es = body.title_es
    article.title_en = body.data.titleEn or None
    article.doc_type = body.doc_type
    article.data = body.data.model_dump()
    article.status = body.status
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(
            Article.id == article_id, Article.user_id == current_user.id
        )
    )
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    await db.delete(article)
    await db.commit()
