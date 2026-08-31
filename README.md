# 우리 반 데이터 군집 탐색

초등학생 대상 K-means 체험용 정적 웹앱입니다.

## 기능

- 20명의 10개 생활 속 수치 변수 입력
- 브라우저에서 Standardization 수행
- k=2~6 K-means를 각각 수행하고 평균 Silhouette score 비교
- 최적 k 자동 선택
- PCA 2차원 시각화
- 학생별 cluster와 cluster별 평균 확인

## GitHub Pages 배포

1. GitHub에서 새 repository를 만듭니다.
2. 이 폴더의 `index.html`, `style.css`, `app.js`를 repository 최상위에 업로드합니다.
3. Repository의 **Settings → Pages**로 이동합니다.
4. **Build and deployment → Source**를 `Deploy from a branch`로 설정합니다.
5. Branch를 `main`, Folder를 `/ (root)`로 선택하고 저장합니다.
6. 잠시 후 GitHub Pages 주소가 생성됩니다.

## 구조

```text
student-kmeans-web/
├── index.html
├── style.css
├── app.js
└── README.md
```

## 분석 구조

```text
입력 데이터
→ Standardization
→ k=2~6 K-means 비교
→ Silhouette score 최대 k 선택
→ Cluster 결과

입력 데이터
→ Standardization
→ PCA
→ 2D 시각화
```

PCA는 시각화에만 사용하며 K-means는 표준화된 10개 변수 전체를 사용합니다.

## 참고

GitHub Pages는 정적 호스팅이므로 Python 서버를 직접 실행하지 않습니다.
이 프로젝트는 Python 예제와 동일한 분석 흐름을 JavaScript로 구현하여 모든 계산을 학생의 브라우저 안에서 수행합니다.
