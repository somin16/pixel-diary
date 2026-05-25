# workflows/pixel_art.py
# ComfyUI 픽셀아트 생성 워크플로우 정의
# 워크플로우가 추가될 때 이 파일에만 추가

PIXEL_ART_WORKFLOW = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "12": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["4", 0],
                "clip": ["4", 1],
                "lora_name": "pixel-art-xl.safetensors",
                "strength_model": 0.8,
                "strength_clip": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}   # positive_prompt 삽입 위치
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}   # negative_prompt 삽입 위치
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["12", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
                "seed": 0,                              # 호출 시점에 랜덤값으로 교체됨
                "steps": 25,
                "cfg": 7,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 0.8
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "15": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["8", 0],
                "upscale_method": "nearest-exact",
                "width": 512, "height": 512, "crop": "disabled"
            }
        },
        "18": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["15", 0],
                "upscale_method": "nearest-exact",
                "width": 1024, "height": 1024, "crop": "disabled"
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"images": ["18", 0], "filename_prefix": "ComfyUI"}
        }
    }