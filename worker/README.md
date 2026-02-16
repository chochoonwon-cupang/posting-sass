# Worker (VPS)

입찰 건을 dequeue하여 처리하는 파이썬 워커입니다.

## 실행 방법

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경변수 설정

**Windows (PowerShell / CMD):**
```cmd
setx SUPABASE_URL "https://your-project.supabase.co"
setx SUPABASE_SERVICE_ROLE_KEY "your_service_role_key"
```
(새 터미널에서 적용됨)

**Windows (현재 세션만):**
```cmd
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Linux / macOS:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

또는 `.env` 파일을 worker 디렉토리에 두고:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 실행

```bash
python worker.py
```

## 주의

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 코드에 하드코딩하지 마세요.
- Supabase 대시보드 > Settings > API > service_role key에서 확인할 수 있습니다.
