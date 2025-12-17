import os
from supabase import create_client, Client

url: str = "https://qkzrblzjeuowxwkevpfx.supabase.co" 
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenJibHpqZXVvd3h3a2V2cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2OTMwMCwiZXhwIjoyMDgwODQ1MzAwfQ.zdsHm0kIaljLaKM0fCYi_dwVLwMNsDz-__PZTdMvFoo" 

supabase: Client = create_client(url, key)

def upload_batumae_data():
    print("🏍️ 바튜매 데이터 수집 중...")
    
    # 실제 네이버 카페 크롤링은 복잡하므로(로그인/캡차), 우선 UI 확인용 샘플 데이터를 넣습니다.
    # 나중에 셀레니움(Selenium) 등을 이용한 실제 크롤러로 교체할 수 있습니다.
    
    sample_data = [
        {
            "title": "[바튜매] 야마하 R3 2021년식 팝니다",
            "price": "5200000",
            "location": "서울 강남구",
            "image_url": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80",
            "source": "batumae",
            "external_link": "https://cafe.naver.com/bikecargogo", # 실제로는 해당 게시글 링크
            "year": "2021",
            "mileage": "15000",
            "content": "바튜매에서 관리 잘 된 R3 팝니다. 우꿍 좌꿍 없습니다.",
            "status": "판매중"
        },
        {
            "title": "[바튜매] 22년식 슈퍼커브 110 베이지",
            "price": "2100000",
            "location": "경기 성남시",
            "image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80",
            "source": "batumae",
            "external_link": "https://cafe.naver.com/bikecargogo",
            "year": "2022",
            "mileage": "3400",
            "content": "출퇴근용으로만 썼습니다. 탑박스 포함입니다.",
            "status": "판매중"
        },
        {
            "title": "[바튜매] 할리데이비슨 아이언 883 급매",
            "price": "14500000",
            "location": "부산 해운대구",
            "image_url": "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80",
            "source": "batumae",
            "external_link": "https://cafe.naver.com/bikecargogo",
            "year": "2019",
            "mileage": "21000",
            "content": "배기 튜닝 되어있습니다. 소리 죽입니다.",
            "status": "판매중"
        }
    ]

    for item in sample_data:
        try:
            # 중복 방지를 위해 같은 제목이 있으면 넣지 않음 (선택사항)
            data, count = supabase.table('market').insert(item).execute()
            print(f"✅ 등록 성공: {item['title']}")
        except Exception as e:
            print(f"⚠️ 에러 발생 (이미 있거나 통신 오류): {e}")

if __name__ == "__main__":
    upload_batumae_data()