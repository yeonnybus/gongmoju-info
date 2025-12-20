# Gongmoju Info (공모주 알리미)

공모주(IPO) 정보를 한눈에 볼 수 있는 모바일 최적화 웹 서비스입니다.

## 🏗 Architecture
*   **Client**: Next.js 14 (App Router) + Tailwind CSS
*   **Server**: NestJS (Monolith) + Prisma
*   **Database**: Supabase (PostgreSQL)
*   **Scheduler**: GitHub Actions

## 💡 Why Supabase?
(User Question: "DB 직접 운영하면 어떤가요?")
*   **Backend Learning**: NestJS + Prisma 조합을 사용하므로, 실제 코드는 Self-hosted DB와 100% 동일합니다. 백엔드 로직 학습에 전혀 지장이 없습니다.
*   **Operational Cost**: DB를 직접 운영(Docker/EC2 등)하려면 백업, 보안, 복구, 스토리지 관리를 직접 해야 합니다. 초기에는 앱 개발(기능 구현)에 집중하고, 운영 이슈는 Managed Service(Supabase)에 맡기는 것이 효율적입니다.
*   **Ease of Switch**: 추후 '진짜 운영'을 배우고 싶다면, `DATABASE_URL` 환경변수만 제 개인 서버 주소로 바꾸면 즉시 마이그레이션 가능합니다.

## 🚀 Getting Started

### Client
```bash
cd client
npm run dev
```

### Server
```bash
cd server
npm run start:dev
```
