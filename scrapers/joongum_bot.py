import os
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# --- 1. 설정 및 경로 ---
BASE_DIR = Path(__file__).resolve().parent.parent 
ENV_PATH = os.path.join(BASE_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise ValueError("❌ .env 파일 설정이 올바르지 않습니다.")

supabase: Client = create_client(url, key)

# --- 2. 데이터 정제 함수 ---
def clean_price(text):
    if not text: return "가격 문의"
    text = text.replace(',', '').strip()
    # '8600000원' -> '8600000'
    nums = re.findall(r'\d+', text)
    if nums: return nums[0]
    return "가격 문의"

def clean_mileage(text):
    if not text: return "0"
    nums = re.findall(r'\d+', text.replace(',', ''))
    if nums: return f"{int(nums[0]):,}"
    return "0"

def get_text_by_label(driver, label_list):
    """ 상세페이지 스펙표에서 값 추출 """
    for label in label_list:
        try:
            xpath = f"//*[contains(text(), '{label}')]"
            elements = driver.find_elements(By.XPATH, xpath)
            for el in elements:
                try:
                    # Case 1: td + td 구조
                    val = el.find_element(By.XPATH, "./following-sibling::*[1]").text.strip()
                    if val: return val
                except: pass
                try:
                    # Case 2: div 구조
                    val = el.find_element(By.XPATH, "../following-sibling::*[1]").text.strip()
                    if val: return val
                except: pass
        except: continue
    return None

def fix_image_url(src):
    """ 
    문제의 '/../upload/...' 경로를 정상적인 URL로 변환 
    """
    if not src: return "http://joongum.co.kr/img/common/no_image.gif"
    
    # 1. 이상한 상대경로 치환 (/../ -> /)
    if "/../" in src:
        src = src.replace("/../", "/")
    
    # 2. 도메인이 없으면 붙여줌
    if src.startswith("/"):
        return f"http://joongum.co.kr{src}"
    
    return src

# --- 3. 메인 크롤러 ---
def run_joongum_crawler():
    print("🤖 [가동] 중검단 로봇 (이미지/제목 복구 버전)")
    
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-popup-blocking")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    try:
        # 1. 목록 페이지 접속
        target_url = "http://joongum.co.kr/search_list"
        print(f"🔗 접속 중: {target_url}")
        driver.get(target_url)
        time.sleep(2)
        
        # 2. 카드(div.area) 단위로 요소 찾기
        cards = driver.find_elements(By.CSS_SELECTOR, "div.list-in div.area")
        print(f"📄 목록에서 {len(cards)}개의 매물을 발견했습니다.")
        
        crawling_targets = []

        # 3. 목록에서 1차 정보(링크, 제목, 이미지) 수집
        for card in cards:
            try:
                # A. 링크 추출 (onclick 분석)
                onclick_text = card.get_attribute("onclick")
                link = None
                if onclick_text and "search_view" in onclick_text:
                    match = re.search(r"search_view/\d+", onclick_text)
                    if match:
                        link = f"http://joongum.co.kr/{match.group(0)}"
                
                if not link: continue

                # B. 제목 추출 (목록에 있는 정보가 더 정확함)
                # HTML 예시: <div class="product_tit"> <span class="company">야마하</span> <span class="model">R3</span></div>
                try:
                    title_element = card.find_element(By.CSS_SELECTOR, ".product_tit")
                    title = title_element.text.strip().replace("\n", " ") # 야마하 R3
                except:
                    title = "제목 없음"

                # C. 이미지 추출 및 수리
                img_src = None
                try:
                    img_el = card.find_element(By.CSS_SELECTOR, ".thumnail img")
                    raw_src = img_el.get_attribute("src")
                    img_src = fix_image_url(raw_src) # 🛠️ 여기서 이미지 주소 고침
                except:
                    img_src = "http://joongum.co.kr/img/common/no_image.gif"

                # 수집 대상에 추가
                crawling_targets.append({
                    "link": link,
                    "title": title,
                    "img_src": img_src
                })

            except Exception:
                continue

        # 4. 상세 페이지 순회하며 나머지 정보(연식, 주행거리, 가격) 채우기
        collected_count = 0
        
        # 최신 15개만 진행
        for i, target in enumerate(crawling_targets[:15]):
            try:
                print(f"   [{i+1}/{len(crawling_targets[:15])}] 분석 중: {target['title']}...", end="\r")
                
                driver.get(target['link'])
                time.sleep(0.8) # 로딩 대기

                # 상세 데이터 추출
                raw_price = get_text_by_label(driver, ["판매가", "판매금액", "가격"])
                raw_year = get_text_by_label(driver, ["연식", "년식"])
                raw_mileage = get_text_by_label(driver, ["주행거리", "적산거리", "키로수"])
                
                # 데이터 정제
                price = clean_price(raw_price)
                year = raw_year if raw_year else "연식 미상"
                mileage = clean_mileage(raw_mileage)
                
                # 최종 데이터 패키징
                data = {
                    "title": target['title'],  # 목록에서 가져온 깔끔한 제목
                    "price": price,
                    "location": "전국(탁송가능)",
                    "image_url": target['img_src'], # 수리된 이미지 주소
                    "source": "joongum", # 출처 명시
                    "external_link": target['link'],
                    "year": year,
                    "mileage": mileage,
                    "content": f"#중검단인증 \n전문가 점검 매물입니다. 상세리포트: {target['link']}",
                    "status": "판매중"
                }
                
                # DB 저장 (Upsert)
                existing = supabase.table('market').select('id').eq('external_link', target['link']).execute()
                if not existing.data:
                    supabase.table('market').insert(data).execute()
                    collected_count += 1
                else:
                    supabase.table('market').update({
                        "price": price,
                        "title": target['title'], # 제목 업데이트
                        "image_url": target['img_src'], # 이미지 업데이트
                        "source": "joongum",
                        "status": "판매중"
                    }).eq('external_link', target['link']).execute()

            except Exception as e:
                # print(f"   ⚠️ 상세 에러: {e}")
                continue
                
        print(f"\n🎉 완료! {collected_count}개의 중검단 매물을 저장/갱신했습니다.")

    except Exception as e:
        print(f"💥 에러: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_joongum_crawler()