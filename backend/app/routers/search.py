from fastapi import APIRouter, Query
import httpx

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_books(q: str = Query(..., min_length=1)):
    """Proxy search to Open Library API and return formatted results."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://openlibrary.org/search.json",
            params={"q": q, "limit": 20, "fields": "key,title,author_name,cover_i,number_of_pages_median,first_publish_year,isbn"},
        )

    data = res.json()
    results = []
    for doc in data.get("docs", []):
        cover_i = doc.get("cover_i")
        results.append({
            "open_library_key": doc.get("key"),
            "title": doc.get("title", ""),
            "author": (doc.get("author_name") or [None])[0],
            "cover_url": f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg" if cover_i else None,
            "page_count": doc.get("number_of_pages_median"),
            "publish_year": doc.get("first_publish_year"),
            "isbn": (doc.get("isbn") or [None])[0],
        })

    return results
