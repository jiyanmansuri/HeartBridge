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
            "content_text": "બાજરીનો રોટલો અને રીંગણનો ઓળો! શિયાળાની ઋતુમાં ગરમાગરમ રોટલા પર ઘી લગાવીને ખાવાની મજા જ કંઈક અલગ છે. (Bajri no Rotlo and Ringan no Olo! Having hot rotla smeared with ghee in winter is pure joy.)",
            "author_name": "દાદી રાધાબેન (Radhaben)"
        },
        {
            "id": 9998,
            "category": "Tales from Our Roots",
            "content_text": "અમારા ગામની નદી કિનારે આવેલું એ જૂનું વડનું ઝાડ, જ્યાં અમે બાળપણમાં સંતાકૂકડી રમતા. એ યાદો આજે પણ હૃદયમાં તાજી છે. (The old banyan tree by our village river where we played hide-and-seek in childhood. Those memories are still fresh.)",
            "author_name": "દાદા હસમુખભાઈ (Hasmukhbhai)"
        },
        {
            "id": 9997,
            "category": "Handmade & Heirlooms",
            "content_text": "શરદી-ઉધરસ માટે આદુ, તુલસી અને કાળા મરીનો ઉકાળો. આ અમારા ઘરનો જૂનો અને રામબાણ ઈલાજ છે! (Ginger, Tulsi, and Black Pepper decoction for cold & cough. Our home's time-tested remedy!)",
            "author_name": "શાંતાબા (Shantaba)"
        },
        {
            "id": 9996,
            "category": "Grandma's Kitchen",
            "content_text": "ઘરની બનાવેલી ગરમાગરમ સુખડી! ગોળ, ઘી અને ઘઉંના લોટનો આ સ્વાદ બાળપણના દિવસો યાદ અપાવે છે. (Homemade warm Sukhdi! The taste of jaggery, ghee, and wheat flour brings back childhood days.)",
            "author_name": "મણીબેન પટેલ (Maniben Patel)"
        },
        {
            "id": 9995,
            "category": "Tales from Our Roots",
            "content_text": "અમારા જમાનામાં ચોમાસામાં વરસાદ પડતાં જ આખું ગામ ભેગું થઈને કાગળની હોડીઓ બનાવતું અને ગીતો ગાતું. (In our time, as soon as it rained, the whole village gathered to make paper boats and sing.)",
            "author_name": "મનસુખભાઈ વ્યાસ (Mansukhbhai Vyas)"
        },
        {
            "id": 9994,
            "category": "Handmade & Heirlooms",
            "content_text": "ભરતકામ કરેલી આ સુંદર તોરણ મારા લગ્નમાં મારી માતાએ મને ભેટ આપી હતી, જે આજે પણ મારા ઘરના મુખ્ય દ્વારની શોભા વધારે છે. (This beautiful embroidered Toran was gifted by my mother at my wedding. It still adorns my main door.)",
            "author_name": "કમળાબેન જોષી (Kamlaben Joshi)"
        },
        {
            "id": 9993,
            "category": "Grandma's Kitchen",
            "content_text": "ગરમાગરમ મેથીના ગોટા અને કઢી! વરસાદી સાંજે આ રાષ્ટ્રીય નાસ્તો આખા કુટુંબને હસતું રાખે છે. (Hot Methi na Gota and Kadhi! This rainy evening snack keeps the whole family smiling.)",
            "author_name": "ચંપાબા (Champaba)"
        },
        {
            "id": 9992,
            "category": "Tales from Our Roots",
            "content_text": "જ્યારે લાઈટ નહોતી ત્યારે ફાનસના અજવાળે આખું કુટુંબ આંગણામાં ખાટલા પર બેસીને જૂની વાર્તાઓ સાંભળતું. (When there was no electricity, the whole family sat on cots in the courtyard under lantern light listening to old stories.)",
            "author_name": "દાદા રસિકલાલ (Rasiklal)"
        },
        {
            "id": 9991,
            "category": "Handmade & Heirlooms",
            "content_text": "ઉનાળામાં માટીના ઘડાનું ઠંડું પાણી પીવું એ ફ્રિજના પાણી કરતાં ઘણું ગુણકારી અને સ્વાદિષ્ટ છે. (Drinking cold water from a clay pot in summer is healthier and tastier than fridge water.)",
            "author_name": "રણછોડભાઈ (Ranchhodbhai)"
        },
        {
            "id": 9990,
            "category": "Grandma's Kitchen",
            "content_text": "તાજી ખીચડી અને દહીં, જે પેટ માટે અમૃત સમાન છે. જ્યારે પણ કોઈ બીમાર પડે, ત્યારે આ અમારો પ્રથમ ઇલાજ છે. (Fresh Khichdi and Curd, like nectar for the stomach. Whenever someone is sick, this is our first remedy.)",
            "author_name": "જશોદાબા (Jasodaba)"
        },
        {
            "id": 9989,
            "category": "Tales from Our Roots",
            "content_text": "અમારા ગામના મેળાઓની એ મજા, જ્યાં લાકડાના ચકડોળ પર બેસીને આખા આકાશને સ્પર્શવાનો અહેસાસ થતો. (The joy of our village fairs, where riding the wooden Ferris wheel felt like touching the sky.)",
            "author_name": "કાંતિલાલ મહેતા (Kantilal Mehta)"
        },
        {
            "id": 9988,
            "category": "Handmade & Heirlooms",
            "content_text": "હાથે ગૂંથેલું આ સ્વેટર મેં મારા પૌત્ર માટે બનાવ્યું છે. વણાટના દરેક તારમાં દાદીનો વહાલ વણાયેલો છે. (I hand-knitted this sweater for my grandson. Grandma's love is woven into every stitch.)",
            "author_name": "લીલાબેન (Lilaben)"
        },
        {
            "id": 9987,
            "category": "Grandma's Kitchen",
            "content_text": "રસાદાર ઊંધિયું અને પૂરી! ઉત્તરાયણનો તહેવાર આ પરંપરાગત વાનગી વિના અધૂરો છે. (Juicy Undhiyu and Puri! The festival of Uttarayan is incomplete without this traditional dish.)",
            "author_name": "ભાનુબેન શાહ (Bhanuben Shah)"
        },
        {
            "id": 9986,
            "category": "Tales from Our Roots",
            "content_text": "પહેલાના જમાનામાં ટપાલની જે રાહ જોવાતી, તે લાગણી અને ઉત્તેજના આજની ઇન્સ્ટન્ટ મેસેજિંગ એપ્લિકેશન્સમાં ક્યાંય નથી. (Waiting for letters in the past had an emotion and excitement that instant messaging apps simply cannot match.)",
            "author_name": "પ્રભાશંકર દવે (Prabhashankar Dave)"
        },
        {
            "id": 9985,
            "category": "Handmade & Heirlooms",
            "content_text": "લીમડાના પાન અને કપૂરની ગોળીઓ અનાજને જીવાતોથી બચાવવા માટેનો બેસ્ટ કુદરતી ઉપાય છે. (Neem leaves and camphor tablets are the best natural way to protect grains from pests.)",
            "author_name": "નર્મદાબા (Narmadaba)"
        },
        {
            "id": 9984,
            "category": "Multilingual Support",
            "content_text": "આજે મેં મારા પૌત્ર સાથે અંગ્રેજીમાં વાત કરવાનો પ્રયત્ન કર્યો. આ એપના અનુવાદકની મદદથી અમે એકબીજાને વધુ સારી રીતે સમજી શકીએ છીએ! (Today I tried speaking in English with my grandson. With the help of this translator, we understand each other so much better!)",
            "author_name": "દાદા મુકુંદભાઈ (Mukundbhai)"
        },
        {
            "id": 9983,
            "category": "Multilingual Support",
            "content_text": "Learning new words in Gujarati keeps my mind active. Connecting with elders across the language barrier is wonderful.",
            "author_name": "Hector"
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
