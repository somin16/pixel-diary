import os
import requests
import base64
import uuid
from dotenv import load_dotenv 
from supabase import create_client, Client

load_dotenv() 

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SD_API_URL = os.getenv("SD_API_URL", "http://127.0.0.1:7860")
BUCKET_NAME = "diary-images"

# 환경 변수 로드 (실제로는 .env 파일에서 관리)
SD_API_URL = os.getenv("SD_API_URL", "http://127.0.0.1:7860")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
BUCKET_NAME = "diary-images"

# Supabase 클라이언트 초기화
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_and_upload_image(prompt, negative_prompt=""):
    """
    1. Stable Diffusion API로 그림 생성
    2. 생성된 이미지를 Supabase Storage에 업로드
    3. 업로드된 이미지의 Public URL 반환
    """
    
    # [1] Stable Diffusion API 호출 설정
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "steps": 25,          # 생성 단계 (높을수록 정교함)
        "width": 512,
        "height": 512,
        "cfg_scale": 7,       # 프롬프트 충실도
        "sampler_name": "Euler a",
    }

    print(f"🎨 그림 생성 요청 중: {prompt}")
    
    try:
        # SD API에 POST 요청
        response = requests.post(url=f'{SD_API_URL}/sdapi/v1/txt2img', json=payload)
        response.raise_for_status()
        r = response.json()

        # 결과물(Base64 문자열) 가져오기
        image_base64 = r['images'][0]
        image_data = base64.b64decode(image_base64) # 바이트 데이터로 변환

        # [2] Supabase Storage에 업로드
        file_name = f"diary_{uuid.uuid4()}.png" # 겹치지 않는 파일명 생성
        
        # 스토리지 업로드 실행
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=image_data,
            file_options={"content-type": "image/png"}
        )

        # [3] 공개 URL 가져오기
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
        
        print(f"✅ 업로드 완료! URL: {public_url}")
        return public_url

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return None
    
    # 테스트 실행부
if __name__ == "__main__":
    # 로컬 서버가 켜져 있는지 확인하고 실행하세요!
    print("🚀 테스트 시작...")
    test_result = generate_and_upload_image(
        prompt="A beautiful watercolor painting of a sunset over the Han River, high quality, dreamlike",
        negative_prompt="blurry, low quality, distorted"
    )
    
    if test_result:
        print(f"🎉 성공! 브라우저에서 확인하세요: {test_result}")
    else:
        print("😭 실패! 터미널의 에러 메시지를 확인해 주세요.")