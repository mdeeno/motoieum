import requests
from bs4 import BeautifulSoup
from supabase import create_client
import os
import time

# 1. 환경변수 로드
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 환경변수(SUPABASE_URL, SUPABASE_KEY)가 없습니다.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_batumae_crawler():
    print("🏍️ [가동] 바튜매 로봇 (Requests 방식)")

    # 네이버 카페 차단 방지용 헤더
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://cafe.naver.com/bikecargogo"
    }

    # 탐색할 게시판 URL 리스트 (125cc 이상 / 미만)
    # iframe 내부 실제 주소입니다.
    urls_to_crawl = [
        # (URL, 분류태그)
        ("https://cafe.naver.com/ArticleList.nhn?search.clubid=20188722&search.menuid=1557&search.boardtype=L", "over125"), # 125cc 이상
        ("https://cafe.naver.com/ArticleList.nhn?search.clubid=20188722&search.menuid=1558&search.boardtype=L", "under125")  # 125cc 미만
    ]

    total_saved = 0

    for url, tag in urls_to_crawl:
        print(f"\n🔍 '{tag}' 게시판 스캔 중...")
        
        try:
            # 1. 페이지 접속
            res = requests.get(url, headers=headers)
            
            # 인코딩 처리 (네이버는 보통 cp949)
            if "charset=utf-8" in res.text.lower():
                res.encoding = 'utf-8'
            else:
                res.encoding = 'cp949'

            soup = BeautifulSoup(res.text, 'html.parser')

            # 2. 게시글 목록 찾기
            rows = soup.select('div.article-board > table > tbody > tr')
            
            # 목록이 비었거나 공지사항만 있는 경우 체크
            if not rows:
                print("   ❌ 게시글을 찾을 수 없습니다. (HTML 구조 변경됨)")
                continue

            print(f"   -> 게시글 {len(rows)}개 발견! 데이터 추출 시작...")

            for row in rows[:15]: # 최대 15개만 확인
                try:
                    # 제목 추출
                    title_tag = row.select_one('a.article')
                    if not title_tag:
                        continue # 공지사항 필터링
                        
                    title = title_tag.get_text(strip=True)
                    # href 앞에 cafe.naver.com 붙이기
                    link = "https://cafe.naver.com" + title_tag['href']

                    # 가격 추출 (로그인 안 하면 안 보일 수 있음 -> '가격문의'로 처리)
                    price_tag = row.select_one('.td_won')
                    price = price_tag.get_text(strip=True) if price_tag else "가격문의"

                    # 날짜/작성자 등 (필요 시)
                    date_tag = row.select_one('.td_date')
                    date = date_tag.get_text(strip=True) if date_tag else ""

                    # 3. 중복 체크 (DB에 이미 있는 링크인지 확인)
                    existing = supabase.table("market").select("id").eq("external_link", link).execute()
                    if existing.data:
                        # 이미 있으면 건너뜀
                        print(f"      [Pass] 중복: {title}")
                        continue

                    # 4. 저장할 데이터 구성
                    data = {
                        "title": f"[바튜매] {title}",
                        "content": f"{tag} / {date} 등록 (상세내용은 링크 참조)",
                        "price": price,
                        "image_url": "https://cafe.naver.com/favicon.ico", # 리스트에선 이미지 못 가져옴
                        "external_link": link,
                        "source": "batumae",
                        "year": "2024",   # 임시값
                        "mileage": "0km"  # 임시값
                    }
                    
                    # 5. DB 저장
                    supabase.table("market").insert(data).execute()
                    print(f"      ✅ [저장] {title}")
                    total_saved += 1

                except Exception as e:
                    print(f"      ❌ 에러: {e}")
                    continue

        except Exception as e:
            print(f"   ❌ 접속 실패: {e}")

    print(f"\n🎉 총 {total_saved}개의 바튜매 매물을 새로 저장했습니다.")

if __name__ == "__main__":
    run_batumae_crawler()