/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  CornerDownRight, 
  MessageSquare, 
  PlusSquare, 
  Sparkles, 
  WrapText, 
  Send, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { DiffFile, PRComment, DiffLine } from '../types';

interface CodeDiffViewProps {
  repoId: number;
  prId: number;
  selectedFile: string;
  files: DiffFile[];
  comments: PRComment[];
  onCommentAdded: () => void;
  isMobileMode?: boolean;
}

export default function CodeDiffView({
  repoId,
  prId,
  selectedFile,
  files,
  comments,
  onCommentAdded,
  isMobileMode = false
}: CodeDiffViewProps) {
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [inlineCommentLine, setInlineCommentLine] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [aiReviewSummary, setAiReviewSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState<string>('gitbot_dev');
  const [errorText, setErrorText] = useState<string>('');

  // Find currently active file diff
  const activeFile = files.find(f => f.filePath === selectedFile) || files[0];

  useEffect(() => {
    // Reset inline input whenever selected file changes
    setInlineCommentLine(null);
    setNewCommentText('');
    setAiReviewSummary('');
    setErrorText('');
  }, [selectedFile]);

  // Handle submitting a normal inline comment
  const handlePostComment = async (lineNum: number) => {
    if (!newCommentText.trim()) return;

    try {
      const response = await fetch(`/api/v1/repos/${repoId}/pulls/${prId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_path: activeFile.filePath,
          line_number: lineNum,
          author: authorName || 'developer',
          content: newCommentText
        })
      });

      if (response.ok) {
        setNewCommentText('');
        setInlineCommentLine(null);
        onCommentAdded();
      } else {
        const errData = await response.json();
        setErrorText(errData.error || 'Lỗi đăng bình luận');
      }
    } catch (err: any) {
      console.error(err);
      setErrorText('Không thể kết nối đến máy chủ.');
    }
  };

  // Handle triggering server-side Gemini AI reviewer
  const handleTriggerAIReview = async () => {
    if (!activeFile) return;
    setIsAiLoading(true);
    setAiReviewSummary('');
    setErrorText('');

    try {
      const response = await fetch('/api/v1/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: activeFile.filePath,
          diffLines: activeFile.lines
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiReviewSummary(data.review);
        // Also call parent onCommentAdded to refresh the inline comments
        onCommentAdded();
      } else {
        setErrorText(data.error || 'Ý kiến từ AI thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorText('Lỗi kết nối máy chủ khi thực hiện AI Review.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-950/40 rounded-xl border border-slate-900">
        <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm">Vui lòng chọn một tệp tin để xem chi tiết Code Diff.</span>
      </div>
    );
  }

  // Group comments by line number for simple lookups inside the code loop
  const commentsByLine: Record<number, PRComment[]> = {};
  comments
    .filter(c => c.file_path === activeFile.filePath)
    .forEach(c => {
      const line = c.line_number || 0;
      if (!commentsByLine[line]) commentsByLine[line] = [];
      commentsByLine[line].push(c);
    });

  // Calculate line numbers sequentially for high quality representation
  let oldLineNum = 0;
  let newLineNum = 0;

  const linesWithAttachedMetadata = activeFile.lines.map((line) => {
    if (line.type === 'added') {
      newLineNum++;
      return { ...line, newLineNumber: newLineNum, oldLineNumber: undefined };
    } else if (line.type === 'deleted') {
      oldLineNum++;
      return { ...line, oldLineNumber: oldLineNum, newLineNumber: undefined };
    } else {
      oldLineNum++;
      newLineNum++;
      return { ...line, oldLineNumber: oldLineNum, newLineNumber: newLineNum };
    }
  });

  return (
    <div className="flex flex-col gap-4 font-sans">
      
      {/* Diff Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {activeFile.filePath}
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
            +{activeFile.additions}
          </span>
          <span className="text-xs font-mono text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/10 font-bold">
            -{activeFile.deletions}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Word wrap button */}
          <button 
            id="toggle-word-wrap-btn"
            onClick={() => setWordWrap(!wordWrap)}
            title="Bật/Tắt tự động xuống dòng code"
            className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
              wordWrap 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
            <span>Xuống dòng</span>
          </button>

          {/* AI code review trigger button */}
          <button 
            id="trigger-ai-review-btn"
            onClick={handleTriggerAIReview}
            disabled={isAiLoading}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border text-white transition-all shadow-sm ${
              isAiLoading
                ? 'bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-indigo-500/30 shadow-violet-900/10'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-pulse' : 'text-amber-300'}`} />
            <span>{isAiLoading ? 'AI Đang Quét...' : 'AI Code Review (Gemini)'}</span>
          </button>
        </div>
      </div>

      {/* General Error Banner */}
      {errorText && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-rose-300">Giao dịch thất bại</span>
            <span className="text-xs text-rose-400 mt-1 leading-relaxed">{errorText}</span>
          </div>
        </div>
      )}

      {/* AI Detailed Review Panel */}
      {aiReviewSummary && (
        <div id="ai-review-panel" className="bg-gradient-to-b from-indigo-950/20 to-slate-950/60 border border-indigo-500/20 rounded-xl p-4 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-xs font-semibold text-indigo-300 font-mono">BẢN ĐÁNH GIÁ CHUYÊN SÂU TỪ GITBOT AI</span>
            </div>
            <button 
              onClick={() => setAiReviewSummary('')} 
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Đóng
            </button>
          </div>
          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-1">
            {aiReviewSummary}
          </div>
          <div className="border-t border-slate-800/40 pt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Mô hình sử dụng: <strong>gemini-3.5-flash</strong></span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">Sếp Dev AI khuyên dùng</span>
          </div>
        </div>
      )}

      {/* Unified Code View Block */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-[#111625] px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="font-mono text-[11px] text-slate-400">Unified Code Diff View</span>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {isMobileMode ? 'Double-tap dòng code để viết ý kiến' : 'Nhấp đúp hoặc bấm biểu tượng bình luận'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {linesWithAttachedMetadata.map((line, idx) => {
                // Determine CSS background of the code row
                let rowBg = 'hover:bg-slate-900/40';
                let indicatorColor = 'text-slate-600';
                let contentColor = 'text-slate-300';
                let sign = ' ';

                if (line.type === 'added') {
                  rowBg = 'bg-emerald-500/10 hover:bg-emerald-500/15';
                  indicatorColor = 'text-emerald-500/70 font-semibold font-bold';
                  contentColor = 'text-emerald-350';
                  sign = '+';
                } else if (line.type === 'deleted') {
                  rowBg = 'bg-rose-500/5 hover:bg-rose-500/10 line-through';
                  indicatorColor = 'text-rose-500/70 font-bold';
                  contentColor = 'text-rose-350';
                  sign = '-';
                }

                // Check key lines to display double-tap indicators
                const targetLineNumber = line.type === 'deleted' ? line.oldLineNumber : line.newLineNumber;
                const isCommentInputActive = inlineCommentLine === idx;
                const lineComments = commentsByLine[targetLineNumber || 99999] || [];

                return (
                  <React.Fragment key={idx}>
                    {/* Main Line Content Row */}
                    <tr 
                      className={`group transition-all duration-150 border-b border-slate-900/10 relative ${rowBg}`}
                      onDoubleClick={() => setInlineCommentLine(isCommentInputActive ? null : idx)}
                    >
                      {/* Left side line index columns */}
                      {!isMobileMode ? (
                        <>
                          <td className="w-10 select-none text-right font-mono text-[11px] text-slate-500 border-r border-slate-800/45 px-2 bg-slate-950/40">
                            {line.oldLineNumber || ''}
                          </td>
                          <td className="w-10 select-none text-right font-mono text-[11px] text-slate-500 border-r border-slate-800/45 px-2 bg-slate-950/40">
                            {line.newLineNumber || ''}
                          </td>
                        </>
                      ) : (
                        // On Mobile, we merge and display only relevant single number inside one thin column
                        <td className="w-10 select-none text-center font-mono text-[11px] text-slate-500 border-r border-slate-800/45 px-1 bg-slate-950/40.">
                          {line.newLineNumber || line.oldLineNumber || ''}
                        </td>
                      )}

                      {/* Sign indicator */}
                      <td className={`w-6 select-none text-center font-mono text-[11px] font-bold ${indicatorColor}`}>
                        {sign}
                      </td>

                      {/* Code string cell */}
                      <td className={`px-4 py-1.5 font-mono text-[12px] leading-relaxed select-text pr-10 align-middle ${contentColor} ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-visible'}`}>
                        {line.content || ' '}

                        {/* Comment balloon icon on hover */}
                        <button
                          onClick={() => setInlineCommentLine(isCommentInputActive ? null : idx)}
                          title="Thêm góp ý vào dòng này"
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-750 text-slate-300 p-1 rounded border border-slate-700 cursor-pointer"
                        >
                          <PlusSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Comment Display Stream (If comments exist on this line) */}
                    {lineComments.length > 0 && (
                      <tr>
                        <td colSpan={isMobileMode ? 3 : 4} className="bg-slate-950/70 p-3 border-y border-slate-900">
                          <div className="flex flex-col gap-2 pl-6 border-l-2 border-indigo-500/50">
                            {lineComments.map((comment, cIndex) => (
                              <div 
                                key={comment.id} 
                                className={`rounded-lg p-2.5 flex flex-col gap-1 transition-all ${
                                  comment.is_ai 
                                    ? 'bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/10' 
                                    : 'bg-slate-900/90 border border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[11px] font-semibold font-mono ${comment.is_ai ? 'text-amber-400' : 'text-slate-300'}`}>
                                      {comment.author}
                                    </span>
                                    {comment.is_ai && (
                                      <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
                                        REVIEWS BOT
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(comment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Inline Comment Input Box (Toggle via double-tap or manual click) */}
                    {isCommentInputActive && (
                      <tr>
                        <td colSpan={isMobileMode ? 3 : 4} className="bg-slate-950 p-4 border-y border-indigo-500/20">
                          <div className="flex flex-col gap-3 max-w-xl mx-auto rounded-lg bg-slate-900 p-3 border border-slate-800 shadow-lg">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-300">Viết bình luận cho dòng {targetLineNumber}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-mono">Tên tác giả:</span>
                                <input 
                                  type="text" 
                                  value={authorName}
                                  onChange={(e) => setAuthorName(e.target.value)}
                                  placeholder="Tên bạn..."
                                  className="bg-slate-950 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-800 outline-none w-28 focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <textarea
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="Nhập ý kiến cải thiện, giải thích hoặc chỉ lỗi dòng code này..."
                              rows={3}
                              className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-md border border-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
                            />

                            <div className="flex items-center justify-end gap-2 text-xs">
                              <button
                                onClick={() => setInlineCommentLine(null)}
                                className="px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-950/80 cursor-pointer"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                onClick={() => handlePostComment(targetLineNumber || 0)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition-all cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Gửi bình luận</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
