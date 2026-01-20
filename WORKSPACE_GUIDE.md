# Eywa Workspace Guide

## Workspace와 마크다운 파일 로딩

Eywa는 로컬 폴더의 마크다운 파일들을 workspace로 가져와서 관리할 수 있습니다.

## 기능

### 1. 폴더에서 마크다운 파일 로드

워크스페이스 설정에서 로컬 폴더를 선택하면 해당 폴더의 모든 `.md` 파일을 자동으로 가져옵니다.

**작동 방식:**
- 폴더와 하위 폴더를 재귀적으로 스캔
- 모든 `.md` 파일을 노트로 변환
- 각 파일의 첫 번째 `# 제목`을 노트 제목으로 사용
- 파일 경로를 노트 ID로 사용
- 자동으로 semantic embedding 생성

### 2. 파일 동기화

파일 시스템의 변경사항을 Eywa와 동기화할 수 있습니다.

**동기화 규칙:**
- **새 파일**: 새로운 노트로 추가
- **수정된 파일**: 파일의 수정 시간이 더 최신이면 업데이트
- **변경 없음**: 스킵

### 3. 자동 태그 추출

마크다운 파일 내의 `#태그` 형식을 자동으로 인식하여 노트 태그로 추가합니다.

## 사용 방법

### 초기 설정

1. **워크스페이스 설정 열기**
   - 좌상단의 ⚙️ 버튼 클릭

2. **폴더 선택**
   - "Load from Folder" 버튼 클릭
   - 마크다운 파일이 있는 폴더 선택
   - 브라우저가 폴더 접근 권한 요청하면 허용

3. **파일 가져오기 대기**
   - 파일 개수에 따라 시간이 걸릴 수 있습니다
   - 각 파일마다 embedding 생성이 필요합니다

4. **결과 확인**
   ```
   Import Results:
   - Imported: 10 new files
   - Updated: 0 files
   - Skipped: 0 files
   ```

### 파일 동기화

파일을 수정한 후 변경사항을 Eywa에 반영하려면:

1. **Sync 버튼 클릭**
   - 좌상단의 ↻ 버튼 클릭

2. **동기화 메시지 확인**
   ```
   Synced: 2 new, 3 updated
   ```

### 지원되는 브라우저

**File System Access API** 지원 필요:
- ✅ Chrome/Edge (버전 86+)
- ✅ Opera (버전 72+)
- ❌ Firefox (현재 미지원)
- ❌ Safari (현재 미지원)

Firefox/Safari 사용자는 데스크톱 앱을 사용하세요.

## 폴더 구조 예시

```
my-notes/
├── daily/
│   ├── 2026-01-20.md
│   └── 2026-01-21.md
├── projects/
│   ├── eywa.md
│   └── research.md
└── ideas.md
```

모든 파일이 Eywa로 가져와져서 노트 리스트에 표시됩니다.

## 마크다운 파일 형식

### 제목 추출

첫 번째 H1 헤딩이 노트 제목이 됩니다:

```markdown
# 이것이 노트 제목입니다

내용...
```

H1이 없으면 첫 번째 비어있지 않은 줄을 제목으로 사용합니다.

### 헤딩 청킹

모든 헤딩은 자동으로 청크로 분리되어 개별 embedding을 가집니다:

```markdown
# 메인 주제

내용...

## 하위 주제 A

내용 A...

## 하위 주제 B

내용 B...
```

각 헤딩 섹션이 별도로 검색 가능합니다.

### 태그 추출

`#태그` 형식이 자동으로 추출됩니다:

```markdown
이것은 #프로젝트 관련 내용입니다.
#eywa #ai #notes
```

태그: `project`, `eywa`, `ai`, `notes`

## 권한 관리

### 브라우저 권한

첫 번째 폴더 선택 시 브라우저가 권한을 요청합니다:

1. **Read access**: 파일 읽기만 가능
2. **허용**: Eywa가 파일을 읽을 수 있음
3. **거부**: 파일 로드 불가

### 권한 지속성

브라우저는 선택한 폴더에 대한 권한을 기억합니다. 다음번에는 재요청하지 않습니다.

권한을 취소하려면:
- Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 최근 활동

## 성능 고려사항

### 대용량 폴더

파일이 많으면 초기 로딩이 느릴 수 있습니다:

- **100개 파일**: 약 1-2분
- **500개 파일**: 약 5-10분
- **1000개 파일**: 약 15-20분

Embedding 생성이 가장 시간이 걸립니다.

### 권장사항

- 작은 폴더부터 시작
- 필요한 파일만 선택된 폴더에 포함
- 첫 로드 후에는 동기화가 빠름 (수정된 파일만)

## 문제 해결

### "Permission denied" 에러

**원인**: 브라우저가 폴더 접근 권한이 없음

**해결**:
1. 다시 "Load from Folder" 클릭
2. 권한 허용
3. 또는 브라우저 설정에서 권한 관리

### "Unsupported browser" 메시지

**원인**: 브라우저가 File System Access API를 지원하지 않음

**해결**:
- Chrome/Edge로 전환
- 또는 Eywa Desktop 앱 사용

### 파일이 업데이트되지 않음

**원인**: 파일 수정 시간이 노트보다 오래됨

**해결**:
1. 파일을 다시 저장 (수정 시간 업데이트)
2. Sync 버튼 클릭
3. 또는 노트를 삭제하고 다시 가져오기

### Embedding 생성 실패

**원인**: 네트워크 문제 또는 모델 로딩 실패

**해결**:
1. 인터넷 연결 확인
2. 페이지 새로고침
3. 브라우저 콘솔에서 에러 확인

## 데스크톱 앱

Desktop 앱은 더 강력한 파일 시스템 통합을 제공합니다:

- 파일 변경 감지 (File Watcher)
- 더 빠른 파일 읽기
- 브라우저 제한 없음
- 모든 OS 지원

Desktop 앱 실행:
```bash
npm run dev:desktop
```

## 예제 워크플로우

### 1. Obsidian/Notion에서 마이그레이션

1. Markdown으로 내보내기
2. Eywa workspace 생성
3. 내보낸 폴더 선택
4. 모든 노트가 자동으로 가져와짐

### 2. 기존 Git 리포지토리 연결

1. 로컬에 clone
2. Eywa에서 해당 폴더 선택
3. 코드와 문서를 함께 관리

### 3. 일일 노트 시스템

1. `daily/` 폴더 생성
2. 매일 새 `.md` 파일 작성
3. Eywa로 동기화
4. 자동 추천으로 관련 노트 발견

## API (개발자용)

프로그래밍 방식으로 파일 가져오기:

```typescript
import { requestDirectoryAccess, readMarkdownFiles } from './services/fileSystemService';
import { importMarkdownFiles } from './services/markdownImportService';

// 폴더 선택
const directory = await requestDirectoryAccess();

// 파일 읽기
const files = await readMarkdownFiles(directory);

// 가져오기
const result = await importMarkdownFiles(workspaceId, directory);
console.log(`Imported ${result.imported} files`);
```

## 보안 및 프라이버시

- **로컬 우선**: 모든 데이터는 브라우저의 IndexedDB에 저장
- **서버 없음**: 파일이 외부로 전송되지 않음
- **Embedding**: 로컬에서 생성 (Transformer.js 사용)
- **권한**: 사용자가 명시적으로 허용한 폴더만 접근

데이터는 절대 서버로 전송되지 않습니다!
