# 눈높이가 바닥에 있는 공학 연구소

공학, 배우려니 너무 어렵죠?
그래서 제 연구소는 눈높이를 바닥까지 낮췄어요.
저부터 이해가 안 됐거든요.
그림과 숫자로 최대한 풀어 쓰고, 하나씩 차근차근 함께 배우는 전자공학·AI 연구소예요.

- 블로그: https://ezenglab.blogspot.com/
- 강좌마다 폴더 하나: `index.md`(강좌 원본)와 그 강좌의 그림

## 올리는 방법
- `python3 tools/blogger.py html <폴더>`: 블로그용 HTML 미리 보기(build/)
- `python3 tools/blogger.py draft <폴더>`: 블로거 임시저장 글 만들기·고치기
- `python3 tools/blogger.py publish <폴더>`: 게시
- `posts.json`: 강좌 폴더와 블로그 글 번호 연결표
- 그림 주소는 jsDelivr로 커밋에 고정해서 불러와요.
