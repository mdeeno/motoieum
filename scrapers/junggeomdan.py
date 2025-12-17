import os
from supabase import create_client, Client

url: str = "https://qkzrblzjeuowxwkevpfx.supabase.co" 
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenJibHpqZXVvd3h3a2V2cGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2OTMwMCwiZXhwIjoyMDgwODQ1MzAwfQ.zdsHm0kIaljLaKM0fCYi_dwVLwMNsDz-__PZTdMvFoo" 

supabase: Client = create_client(url, key)

def upload_junggeomdan_data():
    print("🔍 중검단 데이터 수집 중...")
    
    sample_data = [
        {
            "title": "[중검단 인증] 가와사키 닌자 400 (무사고)",
            "price": "6500000",
            "location": "인천 부평구",
            "image_url": "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&q=80",
            "source": "junggeomdan",
            "external_link": "https://blog.naver.com/junggeomdan",
            "year": "2023",
            "mileage": "5000",
            "content": "중검단에서 점검 완료한 매물입니다. 엔진 상태 최상.",
            "status": "판매중"
        },
        {
            "title": "[중검단] 혼다 PCX 125 23년식",
            "price": "3100000",
            "location": "서울 마포구",
            "image_url": "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80",
            "source": "junggeomdan",
            "external_link": "https://blog.naver.com/junggeomdan",
            "year": "2023",
            "mileage": "12000",
            "content": "배달대행 세팅 완료. 바로 일하시면 됩니다.",
            "status": "판매중"
        }
    ]

    for item in sample_data:
        try:
            data, count = supabase.table('market').insert(item).execute()
            print(f"✅ 등록 성공: {item['title']}")
        except Exception as e:
            print(f"⚠️ 에러 발생: {e}")

if __name__ == "__main__":
    upload_junggeomdan_data()