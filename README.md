# 우리 반 데이터 탐색

초등학생 대상 K-means 군집 분석 체험용 정적 웹앱입니다.

## 화면에서 사용하는 표현
학생 화면에서는 전문 용어를 최대한 제거했습니다.

- Silhouette coefficient → `나뉨 정도`
- Optimal k → `추천 그룹 수`
- PCA projection → 별도 용어 없이 `친구들이 어떻게 나뉘었을까?`
- Cluster → `그룹`

## 입력 파일 형식

CSV, XLSX, XLS 파일을 지원합니다.

필수 열 이름은 아래 영문 이름 또는 괄호 안의 한글 이름 중 하나를 사용하면 됩니다.

- `pencils` (연필 개수)
- `coloredPencils` (색연필 개수)
- `dolls` (인형 개수)
- `books` (책 개수)
- `reading` (독서(분))
- `exercise` (운동(분))
- `game` (게임(분))
- `youtube` (영상시청(분))
- `allowance` (주간용돈(천원))
- `sleep` (수면(시간))

선택적으로 `student`, `학생`, `name`, `이름` 열을 추가하면 학생 이름이 화면에 표시됩니다.

## 실제 분석 방법

1. 입력된 모든 연속형 변수를 Standardization 합니다.
2. k=2~6 범위에서 K-means clustering을 각각 수행합니다.
3. 각 k에 대해 평균 Silhouette coefficient를 계산합니다.
4. Silhouette coefficient가 가장 높은 k를 optimal k로 선택합니다.
5. 최종 K-means 결과를 학생별 cluster와 cluster별 원자료 평균으로 제공합니다.
6. 시각화를 위해서만 standardized feature matrix를 PCA 2차원으로 projection합니다.
7. K-means 자체는 PCA 결과가 아니라 전체 standardized feature matrix에서 수행합니다.

## Silhouette coefficient

각 관측치 i에 대해

s(i) = (b(i) - a(i)) / max(a(i), b(i))

- a(i): 같은 cluster에 속한 다른 관측치들과의 평균 거리
- b(i): 가장 가까운 다른 cluster까지의 평균 거리

전체 관측치의 s(i)를 평균내어 k별 Silhouette coefficient를 구하고, 그 값이 가장 큰 k를 선택합니다.

## GitHub Pages 배포

1. GitHub repository 생성
2. `index.html`, `style.css`, `app.js`를 repository root에 업로드
3. Settings → Pages
4. Source: `Deploy from a branch`
5. Branch: `main`, Folder: `/ (root)`
6. 저장 후 생성된 GitHub Pages URL 사용

## 기술적 구성

GitHub Pages는 Python backend를 실행할 수 없기 때문에 모든 분석은 JavaScript로 브라우저 내부에서 수행합니다.

- Excel/CSV parsing: SheetJS
- Visualization: Chart.js
- Standardization: JavaScript 직접 구현
- K-means: JavaScript 직접 구현
- Silhouette coefficient: JavaScript 직접 구현
- PCA: covariance matrix + power iteration 방식으로 JavaScript 직접 구현
