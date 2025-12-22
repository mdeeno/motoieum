import os
import time
import re
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# --- 기본 설정 ---
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise ValueError("❌ .env 파일이 없거나 키가 없습니다.")

supabase: Client = create_client(url, key)

# --- 데이터 정제 함수들 ---
def clean_number(text):
    return re.sub(r'[^\d]', '', text)

def parse_price_line(text):
    if not text: return "가격 문의"
    # 가격 파싱 시 km, cc 등은 제거
    clean_text = re.sub(r'[\d,.]+\s*(km|키로|k|m|cc)', '', text.lower())
    
    man_match = re.search(r'(\d+)[\s,]*[만]', clean_text)
    if man_match:
        val = int(clean_number(man_match.group(1)))
        return str(val * 10000)
        
    nums = re.findall(r'\d+', clean_text.replace(',', ''))
    if nums:
        best_num = max(nums, key=len)
        val = int(best_num)
        # 연식(1990~2026)이나 배기량(50~1000cc)이랑 헷갈리지 않게 처리
        if 1990 <= val <= 2026: return "가격 문의"
        if 50 <= val < 10000: return str(val * 10000)
        elif val >= 10000: return str(val)
    return "가격 문의"

def parse_mileage_line(text):
    """ 
    개선점: 
    1. 5@@@@ -> 50000 변환
    2. 1,390,000 같은 가격 데이터를 주행거리로 착각하지 않게 '상한선(Max Limit)' 도입 
    """
    if not text: return "0"
    
    # 1. 특수문자(@, x, ?)를 0으로 치환
    text = text.lower().replace('x', '0').replace('@', '0').replace('?', '0')
    
    # 2. '만' + '천' 복합 패턴
    if '만' in text and '천' in text:
        match = re.search(r'(\d+)\s*만\s*(\d+)\s*천', text)
        if match:
            try:
                val = (int(match.group(1)) * 10000) + (int(match.group(2)) * 1000)
                return f"{val:,}"
            except: pass

    # 3. '만' 단위
    if '만' in text:
        man_match = re.search(r'([\d.]+)\s*만', text)
        if man_match:
            try: return f"{int(float(man_match.group(1)) * 10000):,}"
            except: pass
            
    # 4. '천' 단위
    if '천' in text:
        chun_match = re.search(r'([\d.]+)\s*천', text)
        if chun_match:
            try: return f"{int(float(chun_match.group(1)) * 1000):,}"
            except: pass

    # 5. 일반 숫자 (콤마, 점 제거)
    clean_text_for_num = text.replace(',', '').replace('.', '')
    nums = re.findall(r'\d+', clean_text_for_num)
    
    if nums:
        best_num = max(nums, key=len)
        try:
            val = int(best_num)
            # [핵심] 안전장치: 주행거리가 50만km 넘으면 가격으로 오인한 것으로 판단하여 무시
            if val > 500000: 
                return "0"
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

    # 1차 스캔: 지정된 줄 (3, 4, 6번)
    for line in lines:
        clean_line = line.strip().replace(' ', '')
        
        # 3. 제작연식
        if not found_year and ('3.제작연식' in clean_line or '3.연식' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_year(val)
            if parsed != "연식 미상": 
                year = parsed
                found_year = True
        
        # 4. 적산거리
        if not found_mileage and ('4.적산거리' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_mileage_line(val)
            # 0이 아니어야 채택 (5@@@@가 50000으로 잘 변환되면 여기서 채택됨)
            if parsed != "0": 
                mileage = parsed
                found_mileage = True

        # 6. 판매 희망가격
        if not found_price and ('6.판매희망가격' in clean_line or '6.희망가격' in clean_line):
            val = line.split(':')[-1].strip()
            parsed = parse_price_line(val)
            if parsed != "가격 문의": 
                price = parsed
                found_price = True

    # 2차 스캔 (백업): 지정된 줄에서 못 찾았을 때
    if not found_price:
        p_from_title = parse_price_line(title)
        if p_from_title != "가격 문의": price = p_from_title
        else:
            for line in lines:
                if any(k in line for k in ['판매금액', '희망가격', '가격']):
                    p = parse_price_line(line.split(':')[-1])
                    if p != "가격 문의": 
                        price = p
                        break
                        
    if not found_year:
        y_from_title = parse_year(title)
        if y_from_title != "연식 미상": year = y_from_title

    if not found_mileage:
        # 제목에서 km 찾기
        if 'km' in title.lower() or '키로' in title:
            m = parse_mileage_line(title)
            if m != "0": mileage = m
            
        # 본문 전체 뒤지기
        if mileage == "0":
            for line in lines:
                # [핵심] 가격 관련된 줄은 주행거리 찾을 때 무시 (1390000 방지)
                if any(bad_word in line for bad_word in ['가격', '만원', '원', '금액']):
                    continue
                    
                if any(k in line for k in ['적산거리', '주행거리', '키로수']):
                    m = parse_mileage_line(line.split(':')[-1])
                    if m != "0": 
                        mileage = m
                        break
    return price, year, mileage

# --- 이하 크롤링 로직은 기존과 동일 ---
def ensure_content_loaded(driver):
    try:
        driver.find_element(By.CSS_SELECTOR, "a.article, a.tit, a.m-tcol-c, a.bit")
        return True
    except: pass
    try:
        driver.switch_to.frame("cafe_main")
        driver.find_element(By.CSS_SELECTOR, "a.article, a.tit, a.m-tcol-c, a.bit")
        return True
    except:
        driver.switch_to.default_content()
        return False

def scrape_board_final(driver, keyword, category_name):
    print(f"\n   🔎 '{keyword}' 처리 시작...")
    driver.switch_to.default_content()
    
    target_url = None
    try:
        xpath = f"//a[contains(text(), '{keyword}')]"
        links = driver.find_elements(By.XPATH, xpath)
        if links: target_url = links[0].get_attribute("href")
    except: pass

    if not target_url: return []

    driver.get(target_url)
    time.sleep(2)
    
    if not ensure_content_loaded(driver): return []

    try:
        link_elements = driver.find_elements(By.CSS_SELECTOR, "a.article, a.tit, a.m-tcol-c, a.bit")
    except: return []

    links = list(set([el.get_attribute("href") for el in link_elements if el.text.strip()]))
    target_links = links[:12]

    collected = []
    for i, link in enumerate(target_links):
        try:
            print(f"      [{i+1}/{len(target_links)}] 분석 중...", end="\r")
            driver.get(link)
            time.sleep(0.8)

            driver.switch_to.default_content()
            try:
                title = driver.find_element(By.CSS_SELECTOR, "h3.title_text").text.strip()
            except:
                try:
                    driver.switch_to.frame("cafe_main")
                    title = driver.find_element(By.CSS_SELECTOR, "h3.title_text").text.strip()
                except: continue

            if not any(word in title for word in ["판매", "팝니다", "급매", "가격"]): continue

            content_text = ""
            try:
                content_el = driver.find_element(By.CSS_SELECTOR, "div.se-main-container, div.ContentRenderer")
                content_text = content_el.text
            except: pass

            img_src = "https://cafe.naver.com/favicon.ico"
            try:
                images = driver.find_elements(By.CSS_SELECTOR, "div.se-module-image img, div.se-image-resource")
                for img in images:
                    src = img.get_attribute("src")
                    if src and not any(x in src for x in ["sticker", "emoji", "profile"]):
                        if float(img.get_attribute("width") or 0) > 300:
                            img_src = src
                            break
            except: pass

            price, year, mileage = analyze_content(title, content_text)

            data = {
                "title": f"[바튜매] {title}",
                "price": price,
                "location": "서울/경기",
                "image_url": img_src,
                "source": "batumae",
                "external_link": link,
                "year": year, 
                "mileage": mileage,
                "content": f"#{category_name} \n{content_text[:100]}...",
                "status": "판매중"
            }
            collected.append(data)
        except Exception: continue
            
    return collected

def run_auto_crawler():
    print("🤖 [최종본] 바튜매 로봇 (주행거리 50만km 초과 시 무시)")
    
    current_folder = os.getcwd()
    profile_path = os.path.join(current_folder, "bot_profile")
    
    options = Options()
    options.add_argument(f"user-data-dir={profile_path}")
    options.add_argument("--start-maximized")
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-popup-blocking")
    
    driver = None
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get("https://cafe.naver.com/bikecargogo")
        time.sleep(3)

        total_data = []
        total_data.extend(scrape_board_final(driver, "125cc초과", "over125"))
        total_data.extend(scrape_board_final(driver, "125cc미만", "under125"))

        if total_data:
            print(f"\n💾 총 {len(total_data)}개 데이터 저장/갱신 중...")
            for data in total_data:
                existing = supabase.table('market').select('id').eq('external_link', data['external_link']).execute()
                if not existing.data:
                    supabase.table('market').insert(data).execute()
                else:
                    supabase.table('market').update({
                        "image_url": data["image_url"],
                        "price": data["price"],
                        "year": data["year"],
                        "mileage": data["mileage"]
                    }).eq('external_link', data['external_link']).execute()
            print("🎉 완료!")
        else:
            print("💨 데이터 없음")

    except Exception as e:
        print(f"💥 에러: {e}")
    finally:
        if driver: driver.quit()

if __name__ == "__main__":
    run_auto_crawler()