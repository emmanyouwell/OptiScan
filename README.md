Instructions:



Mobile
--cd mobile 
--npm install
--npx expo start


Frontend
--cd frontend
--npm install
--npm run dev

Backend
--cd backend

if wala pang venv folder gawa ka nito:
--python -m venv venv

continue:
--.\venv\Scripts\activate

install the needed requirements if wala pa:
--pip install -r requirements.txt

continue and run the web/backend server:
--uvicorn server:app --reload 


--SHORTCUTS--

--backend shortcut
cd backend
.\venv\Scripts\activate
uvicorn server:app --reload 

--frontend shortcut
cd frontend
npm run dev

--mobile shortcut
cd mobile
npx expo start
