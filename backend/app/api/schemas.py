import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AuthorSchema(BaseModel):
    name: str
    inst: str = ""
    email: str = ""
    orcid: str = ""


class SubSubsectionSchema(BaseModel):
    title: str
    content: str = ""


class SubsectionSchema(BaseModel):
    title: str
    content: str = ""
    subs: list[SubSubsectionSchema] = []


class SectionSchema(BaseModel):
    title: str
    content: str = ""
    fns: list[str] = []
    subs: list[SubsectionSchema] = []


class FigureSchema(BaseModel):
    tipo: Literal["Figura", "Cuadro", "Gráfico"] = "Figura"
    num: int
    title: str = ""
    caption: str = ""
    src: str = ""
    width: int | None = None
    height: int | None = None


class ArticlePayload(BaseModel):
    pageStart: int = 1
    docType: str = "Artículo"
    titleEs: str = ""
    titleEn: str = ""
    doi: str = ""
    citeRef: str = ""
    dateReceived: str = ""
    dateAccepted: str = ""
    datePublished: str = ""
    lic: str = "CC BY 4.0"
    authors: list[AuthorSchema] = []
    absEs: str = ""
    kwEs: str = ""
    absEn: str = ""
    kwEn: str = ""
    sections: list[SectionSchema] = []
    figs: list[FigureSchema] = []
    refs: list[str] = []


class ArticleSave(BaseModel):
    title_es: str
    doc_type: str = "Artículo"
    data: ArticlePayload
    status: str = "draft"


class ArticleResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title_es: str
    title_en: str | None
    doc_type: str
    status: str
    data: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
