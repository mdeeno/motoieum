import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os
import re

# 1. 환경변수 설정
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 환경변수(SUPABASE_URL, SUPABASE_KEY)가 없습니다.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_price(price_text):
    if not price_text or "문의" in price_text:
        return "가격문의"
    # 숫자만 남기고 정제
    clean = re.sub(r'[^\d]', '', price_text)
    if not clean:
        return "가격문의"
    return clean

def extract_info_from_title(title):
    # 제목에서 연식(4자리 숫자) 추출 시도
    year_match = re.search(r'(20\d{2}|1\d{1})년식', title)
    year = year_match.group(0).replace("년식", "") if year_match else "2024" 
    
    # 제목에서 주행거리 추출 시도
    km_match = re.search(r'(\d+[\d,.]*)(?=km|만)', title)
    mileage = km_match.group(0) + "km" if km_match else "0km"
    
    return year, mileage

def run_joongum_crawler():
    print("🤖 [가동] 중검단 로봇 (구조 업데이트 버전)")
    
    url = "http://joongum.co.kr/search_list"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        res = requests.get(url, headers=headers)
        res.encoding = 'utf-8' 

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # ✅ 변경된 HTML 구조에 대응하는 멀티 선택자
        items = soup.select('.products_list > li') or \
                soup.select('.list_box > li') or \
                soup.select('.product_item')

        if not items:
            print("❌ 목록을 찾을 수 없습니다. (HTML 구조 변경됨)")
            return

        print(f"   -> 매물 {len(items)}개 발견! 분석 시작...")

        count = 0
        for item in items[:15]: 
            try:
                link_tag = item.select_one('a')
                if not link_tag: continue
                
                href = link_tag.get('href')
                link = f"http://joongum.co.kr{href}" if not href.startswith('http') else href
                
                title_tag = item.select_one('.title') or item.select_one('.subject')
                if not title_tag: continue
                title = title_tag.get_text(strip=True)

                # 연식/주행거리 추출 로직 유지
                year, mileage = extract_info_from_title(title)

                price_tag = item.select_one('.price')
                raw_price = price_tag.get_text(strip=True) if price_tag else "0"
                price = parse_price(raw_price)

                img_tag = item.select_one('img')
                img_src = img_tag.get('src') if img_tag else None
                if img_src and not img_src.startswith('http'):
                    img_src = f"http://joongum.co.kr{img_src}"

                # 중복 체크
                existing = supabase.table("market").select("id").eq("external_link", link).execute()
                if existing.data:
                    continue

                data = {
                    "title": f"[중검단] {title}",
                    "content": "중검단 매물입니다. 상세 내용은 링크를 확인하세요.", 
                    "price": price,
                    "year": year,
                    "mileage": mileage,
                    "image_url": img_src,
                    "external_link": link,
                    "source": "joongum"
                }

                supabase.table("market").insert(data).execute()
                print(f"      ✅ [저장] {title}")
                count += 1

            except Exception as e:
                print(f"      ⚠️ 항목 처리 중 에러: {e}")
                continue

        print(f"\n🎉 총 {count}개의 중검단 매물을 저장했습니다.")

    except Exception as e:
        print(f"❌ 크롤링 전체 에러: {e}")

if __name__ == "__main__":
    run_joongum_crawler()