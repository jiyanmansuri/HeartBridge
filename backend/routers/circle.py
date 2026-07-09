import os
import shutil
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlmodel import Session, select
from typing import Optional
from database import get_session
from models import CirclePost, User
from utils import emit_event

router = APIRouter(prefix="/api/circle", tags=["circle"])

@router.post("/post")
async def create_circle_post(
    user_id: int = Form(...),
    category: str = Form(...),
    content_text: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    media_path = None
    if photo:
        os.makedirs("uploads", exist_ok=True)
        filename = f"circle_{int(datetime.utcnow().timestamp())}_{photo.filename}"
        media_path = f"uploads/{filename}"
        with open(media_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
            
    circle_post = CirclePost(
        user_id=user_id,
        category=category,
        content_text=content_text,
        media_path=media_path
    )
    session.add(circle_post)
    session.commit()
    session.refresh(circle_post)
    
    user = session.get(User, user_id)
    if user and user.family_group_id:
        emit_event(session, "circle_post_created", user_id, user.family_group_id, {
            "post_id": circle_post.id,
            "category": category,
            "content_text": content_text,
            "media_path": media_path,
            "author_name": user.name
        })
        
    return circle_post

@router.get("/list")
def list_circle_posts(
    scope: Optional[str] = None,
    family_group_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    db_posts = []
    if family_group_id is not None:
        users = session.exec(select(User).where(User.family_group_id == family_group_id)).all()
        user_ids = [u.id for u in users]
        if not user_ids:
            return []
        posts = session.exec(select(CirclePost).where(CirclePost.user_id.in_(user_ids)).order_by(CirclePost.created_at.desc())).all()
        for post in posts:
            user = session.get(User, post.user_id)
            db_posts.append({
                "id": post.id,
                "user_id": post.user_id,
                "category": post.category,
                "content_text": post.content_text,
                "media_path": post.media_path,
                "created_at": post.created_at,
                "author_name": user.name if user else "Elder"
            })
        return db_posts

    posts = session.exec(select(CirclePost).order_by(CirclePost.created_at.desc())).all()
    for post in posts:
        user = session.get(User, post.user_id)
        db_posts.append({
            "id": post.id,
            "user_id": post.user_id,
            "category": post.category,
            "content_text": post.content_text,
            "media_path": post.media_path,
            "created_at": post.created_at,
            "author_name": user.name if user else "Elder"
        })

    dummy_pool = [
        {
            "id": 9999,
            "category": "Grandma's Kitchen",
            "content_text": "Making fresh handmade tagliatelle pasta on Sunday mornings with my grandchildren. The aroma of slow-simmered tomato ragù fills the entire house.",
            "author_name": "Sophia (Rome, Italy)"
        },
        {
            "id": 9998,
            "category": "Tales from Our Roots",
            "content_text": "The cherry blossoms are beginning to bloom along the Meguro River. It reminds me of the spring picnics we had when I was a young boy in Tokyo.",
            "author_name": "Hiroshi (Tokyo, Japan)"
        },
        {
            "id": 9997,
            "category": "Handmade & Heirlooms",
            "content_text": "I am knitting a traditional Aran wool sweater for my new great-granddaughter. The cable patterns carry stories of our family's heritage.",
            "author_name": "Margaret (Dublin, Ireland)"
        },
        {
            "id": 9996,
            "category": "Grandma's Kitchen",
            "content_text": "Brewing a fresh pot of strong cafézinho coffee. In Brazil, we welcome every guest with warm coffee and fresh cheese bread.",
            "author_name": "Maria (São Paulo, Brazil)"
        },
        {
            "id": 9995,
            "category": "Tales from Our Roots",
            "content_text": "Walking along the Seine in the early morning fog. The local bookstores (Bouquinistes) are opening up, just like they did sixty years ago.",
            "author_name": "Jean (Paris, France)"
        },
        {
            "id": 9994,
            "category": "Handmade & Heirlooms",
            "content_text": "My mother gave me her hand-carved maple leaf brooch when I moved to Canada. It still sits on my winter coat every single year.",
            "author_name": "Evelyn (Toronto, Canada)"
        },
        {
            "id": 9993,
            "category": "Grandma's Kitchen",
            "content_text": "Preparing Jollof rice for the family gathering this weekend. The secret is slow-steaming the rice with rich tomato and pepper spices.",
            "author_name": "Kofi (Accra, Ghana)"
        },
        {
            "id": 9992,
            "category": "Tales from Our Roots",
            "content_text": "Sitting in a quiet garden in London with a warm cup of Earl Grey tea, listening to the birds. A perfect moment of peace.",
            "author_name": "Sarah (London, UK)"
        },
        {
            "id": 9991,
            "category": "Handmade & Heirlooms",
            "content_text": "We are crafting traditional clay pots for the upcoming festival. Working with Oaxacan black clay connects us directly to our ancestors.",
            "author_name": "Diego (Oaxaca, Mexico)"
        },
        {
            "id": 9990,
            "category": "Grandma's Kitchen",
            "content_text": "Preparing fresh cardamom tea and warm snacks. Connecting with my daughter in Dubai over our weekly video call always brings joy.",
            "author_name": "Asha (Ahmedabad, India)"
        },
        {
            "id": 9989,
            "category": "Tales from Our Roots",
            "content_text": "Remembering the old alpine hikes we took in Bavaria during my youth. The air was crisp, and we sang folk songs along the trails.",
            "author_name": "Hans (Munich, Germany)"
        },
        {
            "id": 9988,
            "category": "Handmade & Heirlooms",
            "content_text": "I am teaching my grandchildren the art of Chinese paper cutting for the Lunar New Year. Keeping our traditions alive is a blessing.",
            "author_name": "Lin (Singapore)"
        },
        {
            "id": 9987,
            "category": "Grandma's Kitchen",
            "content_text": "Baking fresh Aish Baladi flatbread in our clay oven. The scent of toasted sesame and wheat takes me back to my mother's kitchen.",
            "author_name": "Fatima (Cairo, Egypt)"
        },
        {
            "id": 9986,
            "category": "Tales from Our Roots",
            "content_text": "Remembering the cool ocean breeze at St Kilda beach where my friends and I used to surf every weekend in the 1970s.",
            "author_name": "Arthur (Melbourne, Australia)"
        },
        {
            "id": 9985,
            "category": "Worldwide Stories",
            "content_text": "Connecting with my mother Maria in Lisbon. Sharing stories across oceans makes the distance feel so small.",
            "author_name": "Lucas (Dubai, UAE)"
        },
        {
            "id": 9984,
            "category": "Worldwide Stories",
            "content_text": "Talking to my mother Margaret in Dublin. Seeing her daily logs and hearing her voice reassures me that she is safe and happy.",
            "author_name": "Thomas (Toronto, Canada)"
        },
        {
            "id": 9983,
            "category": "Worldwide Stories",
            "content_text": "Connecting with elders across different cultures and sharing family traditions is wonderful.",
            "author_name": "Hector (New York, USA)"
        }
    ]

    shuffled_dummies = list(dummy_pool)
    random.shuffle(shuffled_dummies)
    
    randomized_dummies = []
    for idx, dummy in enumerate(shuffled_dummies):
        randomized_dummies.append({
            "id": dummy["id"],
            "user_id": 999 - idx,
            "category": dummy["category"],
            "content_text": dummy["content_text"],
            "media_path": None,
            "created_at": (datetime.utcnow() - timedelta(hours=idx)).isoformat(),
            "author_name": dummy["author_name"]
        })

    return db_posts + randomized_dummies
