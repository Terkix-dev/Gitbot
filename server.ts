/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  Repository, 
  PullRequest, 
  PRComment, 
  Pipeline, 
  Job, 
  DiffFile 
} from "./src/types.js";

// Global storage (in-memory database simulation)
const repos: Repository[] = [
  {
    id: 1,
    name: "gitbot-runner-core",
    description: "Công cụ cốt lõi chịu trách nhiệm đọc và thực thi file cấu hình .gitbot-ci.yml",
    language: "Golang",
    stars: 342,
  },
  {
    id: 2,
    name: "gitbot-web-frontend",
    description: "Giao diện Web Responsive tối ưu hóa đa thiết bị & ứng dụng PWA",
    language: "TypeScript",
    stars: 128,
  },
  {
    id: 3,
    name: "gitbot-ssh-gate",
    description: "Cơ chế quản lý phân quyền SSH và truyền file tốc độ cao qua Git Storage",
    language: "Rust",
    stars: 87,
  }
];

const pullRequests: PullRequest[] = [
  {
    id: 124,
    repo_id: 1,
    title: "Tối ưu hóa parser đọc file yaml và sửa lỗi thực thi lệnh tùy ý",
    source_branch: "feature/optimize-yaml-parser",
    target_branch: "main",
    status: "open",
  },
  {
    id: 125,
    repo_id: 1,
    title: "Sửa cơ chế SSH Handshake timeout và ghi nhớ session",
    source_branch: "bugfix/ssh-timeout",
    target_branch: "main",
    status: "merged",
  },
  {
    id: 201,
    repo_id: 2,
    title: "Cập nhật Service Worker phục vụ chế độ cài đặt offline PWA",
    source_branch: "feature/pwa-support",
    target_branch: "main",
    status: "open",
  }
];

// Seed comments
let comments: PRComment[] = [
  {
    id: 1,
    repo_id: 1,
    pr_id: 124,
    file_path: "parser.go",
    line_number: 14,
    author: "hoang_lam_dev",
    content: "Đoạn code này dùng exec.Command trực tiếp với chuỗi đầu vào chưa qua kiểm duyệt, có thể dẫn đến nguy cơ Remote Code Execution (RCE) cực kỳ nguy hiểm!",
    created_at: "2026-06-02T08:30:00Z"
  },
  {
    id: 2,
    repo_id: 1,
    pr_id: 124,
    file_path: "parser.go",
    line_number: 22,
    author: "gitbot-assistant",
    content: "💡 Gợi ý cải tiến: Thay vì dùng RegEx tự chế để trích xuất YAML node, ta nên dùng thư viện 'gopkg.in/yaml.v3' được kiểm chứng để tránh lỗi vỡ tràn số (ReDoS) khi parse file yaml lớn.",
    created_at: "2026-06-02T09:12:00Z",
    is_ai: true
  }
];

// Seed file diffs for PR #124
const prDiffs: Record<number, DiffFile[]> = {
  124: [
    {
      filePath: "parser.go",
      additions: 12,
      deletions: 5,
      lines: [
        { type: "normal", content: "package main" },
        { type: "normal", content: "" },
        { type: "normal", content: "import (" },
        { type: "normal", content: "\t\"fmt\"" },
        { type: "deleted", content: "\t\"io/ioutil\"" },
        { type: "added", content: "\t\"io\"" },
        { type: "added", content: "\t\"os\"" },
        { type: "normal", content: "\t\"os/exec\"" },
        { type: "normal", content: "\t\"strings\"" },
        { type: "normal", content: ")" },
        { type: "normal", content: "" },
        { type: "normal", content: "// ParseAndRun reads .gitbot-ci.yml config and executes jobs" },
        { type: "normal", content: "func ParseAndRun(filePath string) error {" },
        { type: "deleted", content: "\tcontent, err := ioutil.ReadFile(filePath)" },
        { type: "deleted", content: "\tif err != nil { return err }" },
        { type: "added", content: "\tfile, err := os.Open(filePath)" },
        { type: "added", content: "\tif err != nil { return fmt.Errorf(\"failed to open config: %w\", err) }" },
        { type: "added", content: "\tdefer file.Close()" },
        { type: "added", content: "\tcontent, err := io.ReadAll(file)" },
        { type: "added", content: "\tif err != nil { return err }" },
        { type: "normal", content: "" },
        { type: "normal", content: "\t// VULNERABLE DIRECT COMMAND EXECUTION" },
        { type: "normal", content: "\tcmdStr := \"echo Running: \" + string(content)" },
        { type: "deleted", content: "\tcmd := exec.Command(\"sh\", \"-c\", cmdStr)" },
        { type: "added", content: "\t// SỬA ĐỐI: Lọc bỏ ký tự nguy hiểm tránh Shell Injection" },
        { type: "added", content: "\tsanitized := strings.ReplaceAll(cmdStr, \";\", \"\")" },
        { type: "added", content: "\tsanitized = strings.ReplaceAll(sanitized, \"&\", \"\")" },
        { type: "added", content: "\tcmd := exec.Command(\"sh\", \"-c\", sanitized)" },
        { type: "normal", content: "\terr = cmd.Run()" },
        { type: "deleted", content: "\treturn err" },
        { type: "added", content: "\treturn nil" },
        { type: "normal", content: "}" }
      ]
    },
    {
      filePath: ".gitbot-ci.yml",
      additions: 15,
      deletions: 0,
      lines: [
        { type: "added", content: "stages:" },
        { type: "added", content: "  - lint" },
        { type: "added", content: "  - test" },
        { type: "added", content: "  - build" },
        { type: "added", content: "  - deploy" },
        { type: "added", content: "" },
        { type: "added", content: "run-linter:" },
        { type: "added", content: "  stage: lint" },
        { type: "added", content: "  script:" },
        { type: "added", content: "    - golangci-lint run" },
        { type: "added", content: "" },
        { type: "added", content: "unit-test:" },
        { type: "added", content: "  stage: test" },
        { type: "added", content: "  script:" },
        { type: "added", content: "    - go test -v ./..." }
      ]
    }
  ],
  201: [
    {
      filePath: "src/serviceWorker.ts",
      additions: 8,
      deletions: 2,
      lines: [
        { type: "normal", content: "const CACHE_NAME = 'gitbot-cache-v1';" },
        { type: "normal", content: "const ASSETS = [" },
        { type: "normal", content: "  '/'," },
        { type: "normal", content: "  '/index.html'," },
        { type: "deleted", content: "  '/static/js/bundle.js'" },
        { type: "added", content: "  '/assets/main.js'," },
        { type: "added", content: "  '/assets/index.css'," },
        { type: "added", content: "  '/manifest.json'" },
        { type: "normal", content: "];" },
        { type: "normal", content: "" },
        { type: "normal", content: "self.addEventListener('install', (event: any) => {" },
        { type: "deleted", content: "  console.log('SW installed');" },
        { type: "added", content: "  event.waitUntil(" },
        { type: "added", content: "    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))" },
        { type: "added", content: "  );" },
        { type: "normal", content: "});" }
      ]
    }
  ]
};

// Seed Pipelines and Jobs
let pipelines: Record<number, Pipeline[]> = {
  // Key represents repo_id
  1: [
    {
      id: 501,
      commit_sha: "a9bfdc14efb9a3a992d99d3e8dc04c55df9b7754",
      status: "success",
      trigger_by: 12,
      created_at: "2026-06-02T10:15:00Z"
    },
    {
      id: 502,
      commit_sha: "7d0d0fca8fb9a265c04c55df9b7754df93b8214f",
      status: "failed",
      trigger_by: 12,
      created_at: "2026-06-02T11:45:00Z"
    }
  ],
  2: [
    {
      id: 601,
      commit_sha: "12bc3fda8fb9a3a992d99d3e8dc04c55df9b7754",
      status: "success",
      trigger_by: 14,
      created_at: "2026-06-01T15:20:00Z"
    }
  ]
};

let jobs: Record<number, Job[]> = {
  // Key is pipeline_id
  501: [
    { id: 1001, pipeline_id: 501, stage: "lint", name: "golangci-lint", status: "success", log_output: "Running linter on current changes...\nNo issues found! Success." },
    { id: 1002, pipeline_id: 501, stage: "test", name: "go-unit-test", status: "success", log_output: "=== RUN   TestParseAndRun\n--- PASS: TestParseAndRun (0.05s)\nPASS\nok  gitbot/runner/core 0.08s" },
    { id: 1003, pipeline_id: 501, stage: "build", name: "compile-binary", status: "success", log_output: "Building binary for GOOS=linux GOARCH=amd64...\nOutput binary saved in dist/runner\nCompression 12% optimized." },
    { id: 1004, pipeline_id: 501, stage: "deploy", name: "dry-run-deploy", status: "success", log_output: "Verifying dry run deployment on Staging...\nVerified. Complete!" }
  ],
  502: [
    { id: 1011, pipeline_id: 502, stage: "lint", name: "golangci-lint", status: "success", log_output: "Running linter with configurations in .golangci.yml...\n✔ Code style matches standard formatting rules.\nFinished in 1.25s." },
    { id: 1012, pipeline_id: 502, stage: "test", name: "go-unit-test", status: "failed", log_output: "=== RUN   TestSanitizeCommand\n    parser_test.go:44: Expected command sanitized outcome 'echo Running: foo' but got 'Shell inject caught'\n--- FAIL: TestSanitizeCommand (0.01s)\n\n=== RUN   TestBufferOverflow\n--- PASS: TestBufferOverflow (0.00s)\nFAIL\nexit status 1\nFAIL\tgitbot/runner/core\t0.03s" },
    { id: 1013, pipeline_id: 502, stage: "build", name: "compile-binary", status: "pending", log_output: "Job is waiting for previous stage: 'go-unit-test' to pass." },
    { id: 1014, pipeline_id: 502, stage: "deploy", name: "dry-run-deploy", status: "pending", log_output: "Job is waiting for previous stage: 'compile-binary' to pass." }
  ],
  601: [
    { id: 1201, pipeline_id: 601, stage: "lint", name: "eslint-check", status: "success", log_output: "Scanning TypeScript static files...\n✔ Clean compile! No errors." },
    { id: 1202, pipeline_id: 601, stage: "test", name: "jest-frontend-test", status: "success", log_output: "PASS src/components/CodeDiff.test.tsx\nPASS src/App.test.tsx\nRuntime suites: 2 passed, 2 total\nElapsed time: 1.84s" },
    { id: 1203, pipeline_id: 601, stage: "build", name: "vite-compile-spa", status: "success", log_output: "vite v6.2.3 building for production...\n✓ 45 modules transformed.\ndist/index.html                     0.45 kB\ndist/assets/index-D7hL_F2u.css     22.40 kB\ndist/assets/index-C8g7D-qS.js     145.20 kB\n✓ built in 1.40s" },
    { id: 1204, pipeline_id: 601, stage: "deploy", name: "deploy-to-gcp", status: "success", log_output: "Uploading production assets to Cloud Storage cdn...\nDeploying revision gitbot-frontend-v12 to Cloud Run...\nService URL: https://gitbot-frontend.run.app\nService successfully deployed." }
  ]
};

// Variable to track live simulated executions
let activeJobsSimData: Record<number, {
  logs: string[];
  timer: NodeJS.Timeout | null;
  currentIndex: number;
  lines: string[];
}> = {};

// Helper tool to initialize Gemini API client lazily
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("Không tìm thấy Khóa bí mật GEMINI_API_KEY. Vui lòng thêm khóa trong tab Cài đặt > Secrets để kích hoạt AI Review.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === REST ENDPOINTS ===

  // 1. Get code diff details
  app.get("/api/v1/repos/:repo_id/pulls/:pr_id/diff", (req, res) => {
    const prId = parseInt(req.params.pr_id);
    const diff = prDiffs[prId] || [];
    res.json(diff);
  });

  // 2. Fetch comments for a PR file
  app.get("/api/v1/repos/:repo_id/pulls/:pr_id/comments", (req, res) => {
    const prId = parseInt(req.params.pr_id);
    const filtered = comments.filter(c => c.pr_id === prId);
    res.json(filtered);
  });

  // 3. Post a comment
  app.post("/api/v1/repos/:repo_id/pulls/:pr_id/comments", (req, res) => {
    const prId = parseInt(req.params.pr_id);
    const repoId = parseInt(req.params.repo_id);
    const { file_path, line_number, author, content } = req.body;

    if (!file_path || !content) {
      res.status(400).json({ error: "Thiếu dữ liệu tệp hoặc nội dung bình luận." });
      return;
    }

    const newComment: PRComment = {
      id: comments.length + 1,
      repo_id: repoId,
      pr_id: prId,
      file_path,
      line_number: parseInt(line_number) || 0,
      author: author || "dev",
      content,
      created_at: new Date().toISOString()
    };

    comments.push(newComment);
    res.status(201).json(newComment);
  });

  // 4. Get active pipelines for a repository
  app.get("/api/v1/repos/:repo_id/pipelines", (req, res) => {
    const repoId = parseInt(req.params.repo_id);
    res.json(pipelines[repoId] || []);
  });

  // 5. Get jobs for a specific pipeline
  app.get("/api/v1/repos/:repo_id/pipelines/:pipeline_id", (req, res) => {
    const pipelineId = parseInt(req.params.pipeline_id);
    res.json(jobs[pipelineId] || []);
  });

  // 6. Post / Restart / Start a pipeline
  app.post("/api/v1/repos/:repo_id/pipelines/:pipeline_id/run", (req, res) => {
    const pipelineId = parseInt(req.params.pipeline_id);
    const repoId = parseInt(req.params.repo_id);

    // Fetch jobs for that pipeline
    const pipelineJobs = jobs[pipelineId];
    if (!pipelineJobs) {
      res.status(404).json({ error: "Không tìm thấy pipeline." });
      return;
    }

    // Set first job to running, rest to pending
    pipelineJobs.forEach((job, index) => {
      if (index === 0) {
        job.status = "running";
        job.log_output = "⏳ Khởi động GitBot Runner v1.2...\n🔄 Đang đọc container image: golang:1.20-alpine\n";
      } else {
        job.status = "pending";
        job.log_output = "Waiting for preceding job stages to pass...\n";
      }
    });

    // Update entire pipeline state to running
    const repoPipelines = pipelines[repoId] || [];
    const activePipeline = repoPipelines.find(p => p.id === pipelineId);
    if (activePipeline) {
      activePipeline.status = "running";
    }

    // Trigger simulation of logs stream over the background for each job sequencially
    let currentJobIdx = 0;
    
    function simulateNextJob() {
      if (currentJobIdx >= pipelineJobs.length) {
        if (activePipeline) {
          // If we completed everything
          activePipeline.status = "success";
        }
        return;
      }

      const job = pipelineJobs[currentJobIdx];
      job.status = "running";

      // Prepare simulation lines
      let simulatedLines: string[] = [];
      if (job.stage === "lint") {
        simulatedLines = [
          `[GitBot CI] Stage: Lint | Job: ${job.name}`,
          `$ golangci-lint run --verbose`,
          `level=info msg="[runner] target files count: 4"`,
          `level=info msg="[linters] running standard unused, gofmt, errcheck, staticcheck"`,
          `✔ No unused fields or undeclared interfaces found.`,
          `✔ Gofmt check perfectly clean.`,
          `SUCCESS: Stage Lint completed smoothly.`
        ];
      } else if (job.stage === "test") {
        simulatedLines = [
          `[GitBot CI] Stage: Test | Job: ${job.name}`,
          `$ go test -v -cover ./...`,
          `=== RUN   TestParseAndRun`,
          `    parser_test.go:12: Verified YAML reading functions on config files...`,
          `--- PASS: TestParseAndRun (0.04s)`,
          `=== RUN   TestSanitizeInputs`,
          `    parser_test.go:28: Sanity checks clean on execution characters: ; & |`,
          `--- PASS: TestSanitizeInputs (0.01s)`,
          `PASS`,
          `coverage: 91.4% of statements`,
          `ok  gitbot/runner/core 0.051s`,
          `SUCCESS: All unit tests compiled and passed!`
        ];
      } else if (job.stage === "build") {
        simulatedLines = [
          `[GitBot CI] Stage: Build | Job: ${job.name}`,
          `$ CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o dist/runner .`,
          `Compiling parsing routines...`,
          `Verifying external packages...`,
          `Adding platform metadata credentials...`,
          `Successfully bundled! Executable directory size: 14.5MB`,
          `dist/runner md5sum: d41d8cd98f00b204e9800998ecf8427e`,
          `SUCCESS: Build stage completed successfully.`
        ];
      } else {
        simulatedLines = [
          `[GitBot CI] Stage: Deploy | Job: ${job.name}`,
          `$ docker build -t gitbot/runner-core:latest .`,
          `Step 1/4 : FROM alpine:latest`,
          ` ---> ea1258d1cf01`,
          `Step 2/4 : COPY dist/runner /app/runner`,
          ` ---> d459afb9c2`,
          `Step 3/4 : ENTRYPOINT ["/app/runner"]`,
          ` ---> 7fc482fbc1`,
          `Successfully built image: gitbot/runner-core:latest`,
          `$ kubectl rollout restart deployment/runner-core`,
          `Deployment 'runner-core' restarted dynamically (Canary 10%)`,
          `✔ Active monitor status: HEALTHY.`,
          `SUCCESS: Deployment completed on Staging environment.`
        ];
      }

      let lineIdx = 0;
      const interval = setInterval(() => {
        if (lineIdx < simulatedLines.length) {
          job.log_output += `\n${simulatedLines[lineIdx]}`;
          lineIdx++;
        } else {
          clearInterval(interval);
          job.status = "success";
          currentJobIdx++;
          simulateNextJob();
        }
      }, 1000);
    }

    // Begin background simulation loop
    simulateNextJob();

    res.json({ message: "Pipeline is triggered successfully.", status: "running" });
  });

  // 7. GET log stream via Server-Sent Events (SSE) so users experience "real-time logs" in the terminal block!
  app.get("/api/v1/jobs/:job_id/logs-stream", (req, res) => {
    const jobId = parseInt(req.params.job_id);
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial log immediately
    let foundJob: Job | null = null;
    for (const pipelineId in jobs) {
      const job = jobs[pipelineId].find(j => j.id === jobId);
      if (job) {
        foundJob = job;
        break;
      }
    }

    if (!foundJob) {
      res.write(`data: ${JSON.stringify({ log: "Job output undefined.\n" })}\n\n`);
      res.end();
      return;
    }

    const logLines = foundJob.log_output.split("\n");
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < logLines.length) {
        res.write(`data: ${JSON.stringify({ log: logLines[currentIdx], status: foundJob?.status })}\n\n`);
        currentIdx++;
      } else {
        // If the job is active/running, wait for more logs, else finish stream
        if (foundJob?.status !== "running" && foundJob?.status !== "pending") {
          res.write(`data: ${JSON.stringify({ done: true, status: foundJob?.status })}\n\n`);
          clearInterval(interval);
          res.end();
        } else {
          // Check for fresh lines
          const currentLogLines = foundJob ? foundJob.log_output.split("\n") : [];
          if (currentLogLines.length > logLines.length && currentIdx < currentLogLines.length) {
            logLines.push(...currentLogLines.slice(logLines.length));
          }
        }
      }
    }, 150);

    req.on("close", () => {
      clearInterval(interval);
    });
  });

  // 8. AI Code Reviewer Route USING GEMINI-3.5-FLASH
  app.post("/api/v1/ai-review", async (req, res) => {
    const { filePath, diffLines } = req.body;

    if (!filePath || !diffLines || !Array.isArray(diffLines)) {
      res.status(400).json({ error: "Vui lòng nhập tệp tin và các dòng mã nguồn diff hợp lệ." });
      return;
    }

    try {
      const ai = getGemini();

      const prompt = `Bạn là Trợ lý GitBot AI Code Reviewer chuyên nghiệp, thông thái, hài hước và nhạy bén.
Hãy đóng vai trò một Sếp Dev/Tech Lead siêu cấp để phân tích kỹ đoạn code thay đổi dưới đây trong tệp tin "${filePath}".

Đoạn mã code thay đổi (Code Diff dạng Unified):
\`\`\`
${diffLines.map((line: any) => `${line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' '}${line.content}`).join('\n')}
\`\`\`

Yêu cầu cụ thể:
1. Xác định ưu điểm, nhược điểm của các dòng mã nguồn mới thêm (+) hoặc bị xóa (-).
2. Phát hiện lỗi logic, rò rỉ bộ nhớ, hoặc các nguy cơ về bảo mật (ví dụ: Shell Injection, Lộ dữ liệu nhạy cảm, RegEx ReDoS).
3. Cho biết ý kiến của bạn, liệu có nên "Approve" (Phê duyệt) hay "Request changes" (Yêu cầu chỉnh sửa lại).
4. Phản hồi hoàn toàn bằng Tiếng Việt thân thiện, rõ ràng, sử dụng Markdown trực quan (có danh sách bôi đậm, code block chỉ dẫn rõ cách sửa).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const aiText = response.text || "🤖 Nhận diện thành công nhưng không có phản hồi nào được trả về từ Gemini.";
      
      // Also, create a mock dynamic inline comment representing AI's feedback directly into comments list so users see it dynamically!
      const randomLine = diffLines.find((l: any) => l.type === 'added') || diffLines[diffLines.length - 1];
      const targetLineNum = randomLine ? (randomLine.newLineNumber || 15) : 15;

      const newAiComment: PRComment = {
        id: comments.length + 1,
        repo_id: 1,
        pr_id: 124,
        file_path: filePath,
        line_number: targetLineNum,
        author: "gitbot-ai-reviewer",
        content: `🤖 [AI REVIEW] ${aiText.slice(0, 180)}... (Xem đầy đủ trong bảng AI Code Review phía dưới)`,
        created_at: new Date().toISOString(),
        is_ai: true
      };
      
      comments.push(newAiComment);

      res.json({
        review: aiText,
        insertedComment: newAiComment
      });

    } catch (error: any) {
      console.error("Lỗi AI Code reviewer:", error);
      res.status(500).json({ 
        error: error.message || "Đã xảy ra lỗi không xác định khi liên kết với mô hình Gemini AI." 
      });
    }
  });

  // === VITE MIDDLEWARE SETUP ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GitBot Server] Đang hoạt động trên port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Giao dịch khởi động server thất bại:", err);
});
