import os
import time
import re
# 👇 이거 꼭 추가해야 합니다
from dotenv import load_dotenv 
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# 👇 .env 파일 로드
load_dotenv()

# 👇 코드에 비밀번호 직접 적지 않고 가져오기
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# 안전장치
if not url or not key:
    raise ValueError("❌ .env 파일이 없거나 키가 설정되지 않았습니다!")

supabase: Client = create_client(url, key)
def clean_number(text):
    return re.sub(r'[^\d]', '', text)

def parse_price_line(text):
    clean_text = re.sub(r'[\d,.]+\s*(km|키로|k|m|cc)', '', text.lower())
    man_match = re.search(r'(\d+)[\s,]*[만]', clean_text)
    if man_match:
        val = int(clean_number(man_match.group(1)))
        return str(val * 10000)
    nums = re.findall(r'\d+', clean_text.replace(',', ''))
    if nums:
        best_num = max(nums, key=len)
        val = int(best_num)
        if 50 <= val < 10000: return str(val * 10000)
        elif val >= 10000: return str(val)
    return "가격 문의"

def parse_mileage_line(text):
    text = text.lower().replace('x', '0').replace('@', '0').replace('?', '0')
    if '만' in text:
        man_match = re.search(r'([\d.]+)\s*만', text)
        if man_match:
            try:
                val = float(man_match.group(1)) * 10000
                return f"{int(val):,}"
            except: pass
    nums = re.findall(r'\d+', text.replace(',', ''))
    if nums:
        best_num = max(nums, key=len)
        try:
            return f"{int(best_num):,}"
        except: pass
    return "0"

def parse_year(text):
    match = re.search(r'(20\d{2})', text)
    if match:
        year = match.group(1)
        if 1990 <= int(year) <= 2026: return year
    match = re.search(r'(\d{2})\s*(년|년식)', text)
    if match:
        yy = match.group(1)
        return f"20{yy}"
    return "연식 미상"

def analyze_content(title, content_text):
    lines = content_text.split('\n') 
    price = "가격 문의"
    year = "연식 미상"
    mileage = "0"

    for line in lines:
        clean_line = line.strip().replace(' ', '')
        if any(k in clean_line for k in ['판매금액', '희망가격', '판매가격', '가격']):
            parts = line.split(':')
            target = parts[-1] if len(parts) > 1 else line
            p = parse_price_line(target)
            if p != "가격 문의": price = p
        if any(k in clean_line for k in ['연식', '년식', '제작']):
            y = parse_year(line)
            if y != "연식 미상": year = y
        if any(k in clean_line for k in ['적산거리', '주행거리', '키로수', '실키로수']):
            parts = line.split(':')
            target = parts[-1] if len(parts) > 1 else line
            m = parse_mileage_line(target)
            if m != "0": mileage = m

    if price == "가격 문의":
        p = parse_price_line(title) 
        if p != "가격 문의": price = p
    if year == "연식 미상": year = parse_year(title)
    if mileage == "0" and ('km' in title.lower() or '키로' in title):
        m = parse_mileage_line(title)
        if m != "0": mileage = m
    return price, year, mileage

def scrape_board_auto(driver, category_name):
    print(f"   ⚡ '{category_name}' 분석 시작...")
    try:
        driver.switch_to.default_content()
        driver.switch_to.frame("cafe_main")
    except: pass

    link_elements = driver.find_elements(By.CSS_SELECTOR, "a.article, a.tit, a.m-tcol-c")
    links = list(set([el.get_attribute("href") for el in link_elements if el.text.strip()]))
    target_links = links[:15]

    collected = []
    for i, link in enumerate(target_links):
        try:
            print(f"      [{i+1}/{len(target_links)}] 분석 중...", end="\r")
            driver.get(link)
            time.sleep(1)

            try:
                driver.switch_to.default_content()
                driver.switch_to.frame("cafe_main")
            except: pass

            try:
                title = driver.find_element(By.CSS_SELECTOR, "h3.title_text").text.strip()
            except: continue

            if not any(word in title for word in ["판매", "팝니다", "급매", "가격"]): continue

            content_text = ""
            try:
                content_el = driver.find_element(By.CSS_SELECTOR, "div.se-main-container, div.ContentRenderer")
                content_text = content_el.text
            except: pass

            img_src = None
            try:
                images = driver.find_elements(By.CSS_SELECTOR, "div.se-module-image img, div.se-image-resource, div.ContentRenderer img")
                for img in images:
                    src = img.get_attribute("src")
                    if not src: continue
                    if any(x in src for x in ["sticker", "emoji", "profile", "blank", "transparent"]): continue
                    width = float(img.get_attribute("width") or 0)
                    if width > 300 or "postfiles.pstatic.net" in src:
                        img_src = src
                        break
            except: pass
            if not img_src: img_src = "https://cafe.naver.com/favicon.ico"

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
                "content": f"#{category_name} #바튜매 \n{content_text[:100]}...",
                "status": "판매중"
            }
            collected.append(data)
            print(f"      ✅ [{year} / {mileage}km / {price}] {title[:8]}...    ")
        except: continue
    return collected

def run_auto_crawler():
    print("🤖 [18세대] 바튜매 로봇 (ID 추적 클릭 방식)")
    
    current_folder = os.getcwd()
    profile_path = os.path.join(current_folder, "bot_profile")
    
    options = Options()
    options.add_argument(f"user-data-dir={profile_path}")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = None
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get("https://cafe.naver.com/bikecargogo")
        time.sleep(3) 

        total_data = []

        # 🚀 [1단계] 125cc 초과 (menuid=77 찾아서 클릭)
        print("\n🚀 [1단계] 125cc 초과 게시판 ID(77) 찾는 중...")
        try:
            # 메뉴가 왼쪽에 있으므로 메인 프레임으로 나가야 함
            driver.switch_to.default_content()
            # href 속성에 'menuid=77'이 포함된 a 태그 찾기
            menu = driver.find_element(By.CSS_SELECTOR, "a[href*='menuid=77']")
            menu.click()
            time.sleep(2)
            total_data.extend(scrape_board_auto(driver, "over125"))
        except Exception as e:
            print(f"   ⚠️ 메뉴 클릭 실패: {e}")

        # 🛵 [2단계] 125cc 미만 (menuid=78 찾아서 클릭)
        print("\n🛵 [2단계] 125cc 미만 게시판 ID(78) 찾는 중...")
        try:
            driver.switch_to.default_content() # 다시 메인으로
            # href 속성에 'menuid=78'이 포함된 a 태그 찾기
            menu = driver.find_element(By.CSS_SELECTOR, "a[href*='menuid=78']")
            menu.click()
            time.sleep(2)
            total_data.extend(scrape_board_auto(driver, "under125"))
        except Exception as e:
            print(f"   ⚠️ 메뉴 클릭 실패: {e}")

        if total_data:
            print(f"\n💾 총 {len(total_data)}개 데이터 저장 중...")
            for data in total_data:
                existing = supabase.table('market').select('id').eq('external_link', data['external_link']).execute()
                if not existing.data:
                    supabase.table('market').insert(data).execute()
                else:
                     supabase.table('market').update({
                         "image_url": data["image_url"],
                         "price": data["price"],
                         "year": data["year"],
                         "mileage": data["mileage"],
                         "content": data["content"]
                     }).eq('external_link', data['external_link']).execute()
            print("🎉 수집 완료!")
        else:
            print("💨 데이터 없음")

    except Exception as e:
        print(f"💥 에러 발생: {e}")

    finally:
        if driver: driver.quit()

if __name__ == "__main__":
    run_auto_crawler()