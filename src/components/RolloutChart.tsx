/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, Clock, Milestone } from 'lucide-react';
import { RolloutPhase } from '../types';

export default function RolloutChart() {
  const phases: RolloutPhase[] = [
    {
      phase: "Giai đoạn 1: Thiết kế Kiến trúc & Database",
      timeline: "Tuần 1 - Tuần 3",
      tasks: [
        "Chốt sơ đồ chuẩn hóa cơ sở dữ liệu PostgreSQL",
        "Thiết kế đặc tả chi tiết RESTful & gRPC APIs",
        "Xây dựng wireframe UX/UI đa giao diện (Desktop, Tablet, Mobile)"
      ],
      details: "Tập trung định hình cấu trúc dữ liệu thô đảm bảo lưu trữ hàng triệu commit."
    },
    {
      phase: "Giai đoạn 2: Phát triển Core Tính năng (Backend & Git)",
      timeline: "Tuần 4 - Tuần 10",
      tasks: [
        "Dựng hệ thống Git Server (Git Storage Engine - cluster Gitaly)",
        "Định nghĩa cơ cấu phân quyền SSH và mã khóa cặp",
        "Viết Core Runner biên dịch và chạy file .gitbot-ci.yml theo thời gian thực"
      ],
      details: "Xương sống của nền tảng, cho phép tự động hoá CI/CD của lập trình viên."
    },
    {
      phase: "Giai đoạn 3: Phát triển Frontend & AI Bot",
      timeline: "Tuần 11 - Tuần 14",
      tasks: [
        "Lập trình giao diện Responsive tối ưu hóa Code Diff di động",
        "Tích hợp PWA (Progressive Web App) hỗ trợ thông báo đẩy trực tiếp",
        "Tích hợp AI Code Reviewer kết nối Gemini phân tích lỗi thông minh"
      ],
      details: "Biến sản phẩm thành trải nghiệm mượt mà, tiện ích tối đa cho nhà phát triển."
    },
    {
      phase: "Giai đoạn 4: Kiểm thử & Triển khai Production",
      timeline: "Tuần 15 - Tuần 16",
      tasks: [
        "Test hiệu năng chịu tải, bảo mật mã nguồn nghiêm ngặt",
        "Triển khai Docker & Kubernetes (K8s) trên mốc hạ tầng Multi-region",
        "Phát hành Canary Deployment (chạy thử 10% tập người dùng thực tế)"
      ],
      details: "Bảo đảm tính ổn định tuyệt đối khi chuyển trạng thái sang Production."
    }
  ];

  return (
    <div id="rollout-chart-container" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Lộ trình triển khai tổng thể (16 Tuần)</h3>
        </div>
        <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
          MỤC TIÊU MVP
        </span>
      </div>

      <div className="space-y-6">
        {phases.map((phase, idx) => (
          <div key={idx} className="relative group pl-6 border-l-2 border-slate-800 hover:border-emerald-500 transition-colors duration-300">
            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-800 group-hover:bg-emerald-400 transition-all duration-300 ring-4 ring-slate-950" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
              <h4 className="font-semibold text-slate-200 text-sm group-hover:text-emerald-300 transition-colors">
                {phase.phase}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-8 w-fit">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {phase.timeline}
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed italic">
              {phase.details}
            </p>

            <ul className="space-y-2">
              {phase.tasks.map((task, tIdx) => (
                <li key={tIdx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
