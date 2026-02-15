# 커플 가계부 배포 가이드

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `couple-budget`)
4. Google Analytics는 선택사항 (꺼도 됨)
5. **프로젝트 만들기** 클릭

## 2단계: Firestore 데이터베이스 설정

1. Firebase Console 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. 위치 선택: `asia-northeast3` (서울) 추천
4. **테스트 모드에서 시작** 선택 → **만들기**

### 보안 규칙 설정 (중요!)

Firestore > 규칙 탭에서 아래 내용으로 변경:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /budgets/{doc} {
      allow read, write: if true;
    }
  }
}
```

> 참고: PIN 인증은 클라이언트에서 처리하므로, Firestore 규칙은 간단하게 유지합니다.
> 더 강화하고 싶다면 Firebase Auth를 나중에 추가할 수 있습니다.

## 3단계: Firebase 웹 앱 등록

1. Firebase Console > 프로젝트 설정 (톱니바퀴 아이콘)
2. **일반** 탭 하단 > **앱 추가** > 웹 (`</>` 아이콘) 클릭
3. 앱 닉네임 입력 (예: `couple-budget-web`)
4. **앱 등록** 클릭
5. 표시되는 `firebaseConfig` 값을 메모

## 4단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, Firebase에서 복사한 값을 입력:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=couple-budget-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=couple-budget-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=couple-budget-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_ACCESS_PIN=1234
```

> `VITE_ACCESS_PIN`은 접속 시 입력할 인증번호입니다. 원하는 숫자로 변경하세요.

## 5단계: 로컬 테스트

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 테스트

## 6단계: Vercel 배포

### 방법 A: Vercel CLI (터미널)

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포 (처음에 로그인 필요)
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 B: GitHub + Vercel (추천)

1. GitHub에 코드를 push:
```bash
git init
git add .
git commit -m "커플 가계부 초기 배포"
git remote add origin https://github.com/YOUR_USERNAME/couple-budget.git
git push -u origin main
```

2. [Vercel](https://vercel.com/) 접속 → GitHub 계정으로 로그인
3. **Add New Project** → GitHub 저장소 선택
4. **Environment Variables** 에서 `.env` 파일의 값들을 모두 추가:
   - `VITE_FIREBASE_API_KEY` = 값
   - `VITE_FIREBASE_AUTH_DOMAIN` = 값
   - ... (모든 VITE_ 변수 추가)
5. **Deploy** 클릭

배포 완료 후 `https://couple-budget-xxx.vercel.app` 같은 URL이 생성됩니다.

## 7단계: 모바일에서 사용

배포된 URL을 모바일 브라우저에서 열고:

**iPhone**: Safari > 공유 버튼 > **홈 화면에 추가**
**Android**: Chrome > 메뉴 (⋮) > **홈 화면에 추가**

이렇게 하면 앱처럼 아이콘이 생기고, 전체 화면으로 사용 가능합니다!

## 추가 팁

- **커스텀 도메인**: Vercel 대시보드 > Settings > Domains에서 자신의 도메인 연결 가능
- **인증번호 변경**: Vercel 대시보드 > Settings > Environment Variables에서 `VITE_ACCESS_PIN` 값 변경 후 재배포
- **데이터 확인**: Firebase Console > Firestore Database에서 저장된 데이터 직접 확인/수정 가능
