# Reinforced Decision Intelligence Lab 홈페이지

기존 Google Sites의 공개 페이지 11개를 GitHub Pages용 정적 홈페이지로 이전한 프로젝트입니다.
원본: https://sites.google.com/site/donghwanleehome

## 앞으로 수정하는 방법

Codex에서 이 폴더를 열고 “논문 추가”, “구성원 변경”, “연구실 소개 수정”처럼 요청하면 됩니다.
문구·링크·배치는 `content/pages/`의 각 HTML 파일에서 수정하고, 공통 메뉴는 `content/site.json`, 디자인은 `assets/style.css`에서 관리합니다.

1. 내용을 수정합니다.
2. `npm run build`로 배포 파일을 생성합니다.
3. `npm run check`로 내부 링크와 이미지 경로를 확인합니다.
4. GitHub 저장소의 `main` 브랜치에 올리면 GitHub Actions가 자동으로 빌드·검사·배포합니다.

Node.js 20 이상이 필요합니다. 별도 npm 패키지 설치는 필요하지 않습니다.

## 컴퓨터에서 미리 보기

```sh
npm run build
npm run preview
```

브라우저에서 http://127.0.0.1:4173 을 엽니다. 파일 수정 후에는 다시 빌드하고 브라우저를 새로고침합니다.

## 처음 GitHub Pages를 설정할 때

예정 저장소: `donghwan3/donghwan3.github.io`
저장소의 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정합니다.
배포 작업은 `.github/workflows/pages.yml`에 준비되어 있습니다.
배포 성공 후 기본 주소는 https://donghwan3.github.io 입니다.

## 파일 구조

- `content/pages/`: 원본 페이지에서 가져온 편집 가능한 본문과 링크
- `content/site.json`: 사이트 이름, 설명, 메뉴
- `content/migration.json`: 이전한 페이지·이미지 수와 원본 주소
- `assets/images/`: 원본 이미지의 로컬 복사본
- `assets/fonts/`: Montserrat 글꼴 및 OFL 라이선스
- `assets/site.js`: 모바일 메뉴와 전체 사이트 검색
- `scripts/build.mjs`: 모든 페이지와 검색 색인 생성
- `scripts/check.mjs`: 배포 파일 내부 참조 검사
- `dist/`: 생성된 배포 파일, Git에는 포함하지 않음

## 이전 범위

Home, Research, Collaboration, Publication, Presentations, Video Lectures, Books, People, PI, Teaching, Contact를 이전했습니다.
텍스트·링크·이미지·영상의 원본 대비 일치 여부를 검증했습니다. 원본의 `Video Lectures` 페이지는 제목만 있어 동일하게 유지했습니다.
YouTube 영상 12개는 임베드로 유지하며, 출판사·arXiv 논문·Google Drive CV·Zoom·서점 링크는 원래 외부 서비스로 연결합니다.
이들 외부 자료를 내려받거나 재배포한 것은 아닙니다. Google Sites의 편집기·통계·권한 설정은 포함하지 않습니다.

`source-snapshot/`에는 최초 이전 시 원본 HTML이 보관되어 있습니다. 이 폴더와 작업용 `.tools/`, `qa/`는 공개 저장소와 배포에 포함하지 않습니다.
다시 원본을 가져와 덮어쓰려는 경우에만 `scripts/crawl.py`, `scripts/import_content.py`를 실행합니다. 평소 업데이트에는 실행하지 않습니다.
이전 검사는 로컬에서 `python scripts/verify_migration.py`로 실행할 수 있습니다. 이전 도구는 requests, beautifulsoup4, pillow를 사용합니다.

기존 Google 홈페이지는 변경하지 않았습니다. 원본 이미지·본문의 권리는 원권리자에게 있습니다.
