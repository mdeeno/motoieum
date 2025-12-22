import os
import time
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

url: str = "https://qkzrblzjeuowxwkevpfx.supabase.co" 
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenJibHpqZXVvd3h3a2V2cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2OTMwMCwiZXhwIjoyMDgwODQ1MzAwfQ.zdsHm0kIaljLaKM0fCYi_dwVLwMNsDz-__PZTdMvFoo" 

supabase: Client = create_client(url, key)

def run_auto_crawler():
    print("🤖 [3세대] 바튜매 로봇 가동! (전용 프로필 모드)")

    # 1. 현재 폴더에 'bot_profile'이라는 로봇 전용 방을 만듭니다.
    # 이렇게 하면 내 원래 크롬과 충돌이 절대 안 납니다.
    current_folder = os.getcwd()
    profile_path = os.path.join(current_folder, "bot_profile")
    
    print(f"📁 로봇 프로필 경로: {profile_path}")

    options = Options()
    # options.add_argument("--headless") 
    
    # 🔥 [핵심] 로봇 전용 프로필 사용
    options.add_argument(f"user-data-dir={profile_path}")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    # 봇 탐지 회피
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = None
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        
        # 2. 바튜매 접속
        target_url = "https://cafe.naver.com/bikecargogo"
        driver.get(target_url)
        time.sleep(3)

        # 🚨 [최초 1회 필수] 로그인이 안 되어 있다면 사용자가 직접 로그인하게 기다려줌
        if "로그인" in driver.page_source and "로그아웃" not in driver.page_source:
            print("\n" + "="*60)
            print("🚨 [최초 1회 설정] 로봇 전용 프로필이라 로그인이 필요합니다!")
            print("   열린 크롬 창에서 '네이버 로그인'을 직접 해주세요.")
            print("   로그인 후, 카페 메인 화면이 보이면 이 터미널에서 [Enter]를 치세요.")
            print("="*60 + "\n")
            input("⌨️ 로그인 완료 후 엔터 입력 대기 중... ")
        
        print("⚡ 크롤링 시작...")

        # iframe 진입
        try:
            driver.switch_to.frame("cafe_main")
        except:
            pass

        # 게시글 긁기
        articles = driver.find_elements(By.CSS_SELECTOR, "div.article-board > table > tbody > tr")
        if not articles:
             articles = driver.find_elements(By.CSS_SELECTOR, ".article-board tr")

        print(f"📋 게시글 {len(articles)}개 발견! 수집 시작...")
        
        crawled_data = []
        for row in articles[:15]: 
            try:
                title_el = row.find_element(By.CSS_SELECTOR, "a.article")
                title = title_el.text.strip()
                link = title_el.get_attribute("href")
                
                if not any(word in title for word in ["판매", "팝니다", "급매", "가격"]):
                    continue

                price = "가격 문의"
                import re
                numbers = re.findall(r'\d+', title.replace(',', ''))
                for num in numbers:
                    if len(num) >= 4:
                        val = int(num)
                        if val < 10000: price = str(val * 10000)
                        else: price = str(val)
                        break

                item = {
                    "title": f"[바튜매] {title}",
                    "price": price,
                    "location": "서울/경기",
                    "image_url": "https://cafe.naver.com/favicon.ico",
                    "source": "batumae",
                    "external_link": link,
                    "year": "2023",
                    "mileage": "0",
                    "content": f"자동 수집된 매물입니다.\n{link}",
                    "status": "판매중"
                }
                crawled_data.append(item)
                print(f"   Target: {title}")

            except:
                continue

        # DB 저장
        if crawled_data:
            print(f"💾 DB 저장 중... ({len(crawled_data)}개)")
            for data in crawled_data:
                existing = supabase.table('market').select('id').eq('external_link', data['external_link']).execute()
                if not existing.data:
                    supabase.table('market').insert(data).execute()
            print("🎉 저장 완료!")
        else:
            print("💨 수집된 판매글이 없습니다.")

    except Exception as e:
        print(f"💥 에러 발생: {e}")

    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    run_auto_crawler()