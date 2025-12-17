import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# 👇 [필수] 본인의 Supabase URL과 Service Role Key를 넣으세요!
url: str = "https://qkzrblzjeuowxwkevpfx.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenJibHpqZXVvd3h3a2V2cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2OTMwMCwiZXhwIjoyMDgwODQ1MzAwfQ.zdsHm0kIaljLaKM0fCYi_dwVLwMNsDz-__PZTdMvFoo" 

supabase: Client = create_client(url, key)

def get_real_data():
    print("🔥 [실전] 바튜매 접속 시도 중... (크롬 창이 열립니다)")

    # 1. 크롬 브라우저 옵션 설정 (사람처럼 보이게 하기)
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # 창 없이 실행하려면 주석 해제 (테스트 땐 창 보는게 좋음)
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # 네이버가 봇을 차단하지 않도록 User-Agent 설정
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    # 2. 브라우저 실행
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    # 바튜매 '오토바이 팝니다' 게시판 URL (전체글보기 예시)
    # 실제로는 특정 카테고리 ID가 필요할 수 있습니다. 여기선 예시로 검색어를 포함하거나 특정 게시판을 갑니다.
    target_url = "https://cafe.naver.com/bikecargogo?iframe_url=/ArticleList.nhn%3Fsearch.clubid=10076228%26search.menuid=79%26search.boardtype=L"
    
    try:
        driver.get(target_url)
        time.sleep(3) # 로딩 대기 (필수)

        # 🚨 [핵심] 네이버 카페는 'cafe_main'이라는 iframe 안에 내용이 있습니다. 거기로 들어가야 함.
        driver.switch_to.frame("cafe_main")

        # 3. 게시글 목록 가져오기
        articles = driver.find_elements(By.CSS_SELECTOR, "div.article-board > table > tbody > tr")
        
        crawled_data = []
        print(f"📋 게시글 {len(articles)}개 발견! 데이터 추출 시작...")

        for row in articles[:10]: # 테스트로 상위 10개만 가져옵니다.
            try:
                # 제목 가져오기
                title_element = row.find_element(By.CSS_SELECTOR, "a.article")
                title = title_element.text.strip()
                link = title_element.get_attribute("href")
                
                # 작성자 / 날짜 등 (필요시 추가)
                
                # 가격이나 연식은 제목에서 추측하거나 들어가봐야 알 수 있음.
                # 일단 제목에 가격이 없으면 '가격문의'로 처리하거나 임의값 설정
                # (실제로는 상세페이지 들어가서 파싱해야 정확함 -> 속도 느려짐)
                
                # 썸네일이 있는지 확인 (리스트형엔 없을 수도 있음)
                image_url = "https://via.placeholder.com/300?text=No+Image" # 기본 이미지

                if "판매" in title or "팝니다" in title: # 판매글만 필터링
                    print(f"   - 수집 중: {title}")
                    
                    item = {
                        "title": title,
                        "price": "가격 문의", # 상세 페이지 안들어가면 알기 힘듦 (추후 고도화 가능)
                        "location": "전국",   # 상세 페이지 안들어가면 알기 힘듦
                        "image_url": image_url,
                        "source": "batumae",
                        "external_link": link,
                        "year": "2023",      # 제목 파싱 필요 (일단 기본값)
                        "mileage": "0",
                        "content": f"바튜매 실시간 매물입니다.\n원문 링크를 클릭하세요: {link}",
                        "status": "판매중"
                    }
                    crawled_data.append(item)
            
            except Exception as e:
                continue # 에러나면 다음 글

        # 4. DB에 저장
        if crawled_data:
            print(f"💾 총 {len(crawled_data)}개의 매물을 DB에 저장합니다...")
            for data in crawled_data:
                # 제목으로 중복 체크 (이미 있으면 스킵)
                existing = supabase.table('market').select('id').eq('external_link', data['external_link']).execute()
                if not existing.data:
                    supabase.table('market').insert(data).execute()
                    print(f"   ✅ 저장 완료: {data['title']}")
                else:
                    print(f"   ⚠️ 이미 존재함: {data['title']}")
        else:
            print("❌ 수집된 데이터가 없습니다. (네이버 구조가 바뀌었거나 차단됨)")

    except Exception as e:
        print(f"🚫 치명적 오류: {e}")
    
    finally:
        driver.quit() # 브라우저 끄기
        print("🏁 크롤링 종료")

if __name__ == "__main__":
    get_real_data()