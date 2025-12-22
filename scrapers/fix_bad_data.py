import os
import time
import re
from pathlib import Path  # 경로 안전장치를 위한 라이브러리
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# --- 1. 경로 및 환경변수 설정 (안전장치 적용) ---
# 현재 파일(fix_bad_data.py)의 위치를 기준으로 프로젝트 루트(두 단계 위)를 찾습니다.
BASE_DIR = Path(__file__).resolve().parent.parent 
ENV_PATH = os.path.join(BASE_DIR, ".env")
PROFILE_PATH = os.path.join(BASE_DIR, "bot_profile")

# .env 로드
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
    print(f"✅ 환경변수 로드 완료: {ENV_PATH}")
else:
    print(f"❌ .env 파일을 찾을 수 없습니다: {ENV_PATH}")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise ValueError("❌ .env 파일 설정이 올바르지 않습니다.")

supabase: Client = create_client(url, key)

# --- 2. 검증된 데이터 정제 함수 (v4 로직) ---
def clean_number(text):
    return re.sub(r'[^\d]', '', text)

def parse_price_line(text):
    if not text: return "가격 문의"
    clean_text = re.sub(r'[\d,.]+\s*(km|키로|k|m|cc)', '', text.lower())
    
    man_match = re.search(r'(\d+)[\s,]*[만]', clean_text)
    if man_match:
        val = int(clean_number(man_match.group(1)))
        return str(val * 10000)
        
    nums = re.findall(r'\d+', clean_text.replace(',', ''))
    if nums:
        best_num = max(nums, key=len)
        val = int(best_num)
        if 1990 <= val <= 2026: return "가격 문의"
        if 50 <= val < 10000: return str(val * 10000)
        elif val >= 10000: return str(val)
    return "가격 문의"

def parse_mileage_line(text):
    """ 안전장치가 포함된 주행거리 분석 """
    if not text: return "0"
    text = text.lower().replace('x', '0').replace('@', '0').replace('?', '0')
    
    # 만/천 복합
    if '만' in text and '천' in text:
        match = re.search(r'(\d+)\s*만\s*(\d+)\s*천', text)
        if match:
            try: return f"{(int(match.group(1)) * 10000) + (int(match.group(2)) * 1000):,}"
            except: pass
            
    if '만' in text:
        match = re.search(r'([\d.]+)\s*만', text)
        if match:
            try: return f"{int(float(match.group(1)) * 10000):,}"
            except: pass
            
    if '천' in text:
        match = re.search(r'([\d.]+)\s*천', text)
        if match:
            try: return f"{int(float(match.group(1)) * 1000):,}"
            except: pass

    # 일반 숫자 (5@@@@ -> 50000 등)
    clean_text = text.replace(',', '').replace('.', '')
    nums = re.findall(r'\d+', clean_text)
    if nums:
        best_num = max(nums, key=len)
        try:
            val = int(best_num)
            # [안전장치] 50만km 넘으면 가격으로 간주하여 무시
            if val > 500000: return "0"
            return f"{val:,}"
        except: pass
    return "0"

def parse_year(text):
    if not text: return "연식 미상"
    text = text.replace(' ', '')
    match = re.search(r'(20\d{2})', text)
    if match:
        year = int(match.group(1))
        if 1990 <= year <= 2026: return str(year)
    match = re.search(r'(\d{2})[\s]*(년|년식)', text)
    if match: return f"20{match.group(1)}"
    return "연식 미상"

def analyze_content(title, content_text):
    lines = content_text.split('\n')
    price = "가격 문의"
    year = "연식 미상"
    mileage = "0"
    
    found_year = False
    found_mileage = False
    found_price = False

    # 1. 핀포인트 스캔
    for line in lines:
        clean_line = line.strip().replace(' ', '')
        if not found_year and ('3.제작연식' in clean_line or '3.연식' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_year(val)
            if parsed != "연식 미상": 
                year = parsed; found_year = True
        if not found_mileage and ('4.적산거리' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_mileage_line(val)
            if parsed != "0": 
                mileage = parsed; found_mileage = True
        if not found_price and ('6.판매희망가격' in clean_line or '6.희망가격' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_price_line(val)
            if parsed != "가격 문의": 
                price = parsed; found_price = True

    # 2. 백업 스캔
    if not found_price:
        p = parse_price_line(title)
        if p != "가격 문의": price = p
        else:
            for line in lines:
                if any(k in line for k in ['판매금액', '희망가격', '가격']):
                    p = parse_price_line(line.split(':')[-1])
                    if p != "가격 문의": price = p; break
    
    if not found_year:
        y = parse_year(title)
        if y != "연식 미상": year = y

    if not found_mileage:
        if 'km' in title.lower() or '키로' in title:
            m = parse_mileage_line(title)
            if m != "0": mileage = m
        if mileage == "0":
            for line in lines:
                # [중요] 가격 관련 키워드가 있는 줄은 주행거리 탐색 제외
                if any(bad in line for bad in ['가격', '만원', '원', '금액']): continue
                if any(k in line for k in ['적산거리', '주행거리', '키로수']):
                    m = parse_mileage_line(line.split(':')[-1])
                    if m != "0": mileage = m; break
    return price, year, mileage

# --- 3. 실행 로직 ---
def run_fixer():
    print("🚑 [AS 센터] 데이터 수리 로봇 가동 (v4 로직)")
    
    # 1. DB에서 데이터 가져오기 (전체 가져와서 파이썬에서 필터링)
    # 데이터가 많을 경우 range를 나누거나 페이지네이션 필요 (일단 1000개 조회)
    response = supabase.table('market').select('*').limit(1000).execute()
    all_data = response.data
    
    if not all_data:
        print("📭 DB에 데이터가 없습니다.")
        return

    # 2. 수리 대상 선별 (30만km 이상인 경우)
    targets = []
    for item in all_data:
        try:
            m_val = int(item['mileage'].replace(',', ''))
            if m_val > 300000: # 30만km 이상이면 의심
                targets.append(item)
        except:
            # 주행거리가 숫자가 아니거나 에러인 경우도 수리 대상
            targets.append(item)
            
    print(f"📋 총 {len(all_data)}개 중 수리 대상: {len(targets)}개 발견")
    
    if not targets:
        print("✨ 수리할 데이터가 없습니다. (모두 정상 범위)")
        return

    # 3. 브라우저 설정 (bot_profile 경로 안전 적용)
    options = Options()
    options.add_argument(f"user-data-dir={PROFILE_PATH}")
    options.add_argument("--headless") # 화면 없이 실행 (테스트 때는 주석 처리 가능)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-popup-blocking")
    
    driver = None
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        
        # 로그인 세션 활성화를 위해 메인 접속
        driver.get("https://cafe.naver.com/bikecargogo")
        time.sleep(2)
        
        success_count = 0
        
        for i, item in enumerate(targets):
            try:
                print(f"   [{i+1}/{len(targets)}] 수리 중: {item['title'][:15]}...", end="\r")
                driver.get(item['external_link'])
                time.sleep(1.2) # 페이지 로딩 대기
                
                # 프레임 처리
                driver.switch_to.default_content()
                
                # 제목 추출
                try:
                    title = driver.find_element(By.CSS_SELECTOR, "h3.title_text").text.strip()
                except:
                    try:
                        driver.switch_to.frame("cafe_main")
                        title = driver.find_element(By.CSS_SELECTOR, "h3.title_text").text.strip()
                    except:
                        # 게시글이 삭제된 경우
                        # supabase.table('market').delete().eq('id', item['id']).execute()
                        print(f"\n      🗑️ 게시글 삭제됨 (Pass): {item['id']}")
                        continue

                # 본문 추출
                content_text = ""
                try:
                    content_el = driver.find_element(By.CSS_SELECTOR, "div.se-main-container, div.ContentRenderer")
                    content_text = content_el.text
                except: pass

                # 재분석
                new_price, new_year, new_mileage = analyze_content(title, content_text)
                
                # DB 업데이트
                supabase.table('market').update({
                    "price": new_price,
                    "year": new_year,
                    "mileage": new_mileage,
                    "title": f"[바튜매] {title}"
                }).eq('id', item['id']).execute()
                
                success_count += 1
                
            except Exception as e:
                # print(f"\n      ⚠️ 개별 에러: {e}") 
                continue

        print(f"\n🎉 작업 완료! 총 {success_count}개의 데이터를 정상화했습니다.")
        
    except Exception as e:
        print(f"💥 치명적 에러: {e}")
    finally:
        if driver: driver.quit()

if __name__ == "__main__":
    run_fixer()