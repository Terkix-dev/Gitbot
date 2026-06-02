/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Key, Link2 } from 'lucide-react';

export default function SchemaDiagram() {
  const tables = [
    {
      name: "pull_requests",
      desc: "Quản lý đóng góp và yêu cầu phê duyệt code",
      fields: [
        { name: "id", type: "SERIAL", isPK: true, isFK: false, desc: "Khóa chính tăng tự động" },
        { name: "repo_id", type: "INT", isPK: false, isFK: true, desc: "Khóa ngoại liên kết bảng repositories" },
        { name: "title", type: "VARCHAR(255)", isPK: false, isFK: false, desc: "Tiêu đề PR" },
        { name: "source_branch", type: "VARCHAR(100)", isPK: false, isFK: false, desc: "Nhánh nguồn (e.g. feature-xyz)" },
        { name: "target_branch", type: "VARCHAR(100)", isPK: false, isFK: false, desc: "Nhánh đích (e.g. main)" },
        { name: "status", type: "VARCHAR(20)", isPK: false, isFK: false, desc: "Trạng thái (open, closed, merged)" }
      ]
    },
    {
      name: "pipelines",
      desc: "Luồng biên dịch và kiểm thử tự động CI/CD",
      fields: [
        { name: "id", type: "SERIAL", isPK: true, isFK: false, desc: "Khóa chính tăng tự động" },
        { name: "commit_sha", type: "VARCHAR(40)", isPK: false, isFK: false, desc: "Mã hash Commit hash kích hoạt" },
        { name: "status", type: "VARCHAR(20)", isPK: false, isFK: false, desc: "Trạng thái (pending, running, success, failed)" },
        { name: "trigger_by", type: "INT", isPK: false, isFK: true, desc: "Người kích hoạt (Khóa ngoại)" },
        { name: "created_at", type: "TIMESTAMP", isPK: false, isFK: false, desc: "Thời gian tạo" }
      ]
    },
    {
      name: "jobs",
      desc: "Tác vụ con được thực thi trong một Pipeline",
      fields: [
        { name: "id", type: "SERIAL", isPK: true, isFK: false, desc: "Khóa chính tác vụ" },
        { name: "pipeline_id", type: "INT", isPK: false, isFK: true, desc: "Khóa ngoại liên kết bảng pipelines" },
        { name: "stage", type: "VARCHAR(50)", isPK: false, isFK: false, desc: "Nhóm stage (lint, test, build, deploy)" },
        { name: "name", type: "VARCHAR(100)", isPK: false, isFK: false, desc: "Tên chi tiết (e.g. run-unit-test)" },
        { name: "status", type: "VARCHAR(20)", isPK: false, isFK: false, desc: "Trạng thái tác vụ" },
        { name: "log_output", type: "TEXT", isPK: false, isFK: false, desc: "Lưu console log xuất từ Runner" }
      ]
    }
  ];

  return (
    <div id="schema-diagram-container" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Thiết kế Cơ sở Dữ liệu cốt lõi (PostgreSQL)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {tables.map((table, tIdx) => (
          <div key={tIdx} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col hover:border-slate-700 transition-colors">
            
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-col">
              <span className="font-mono text-xs font-semibold text-indigo-400">{table.name}</span>
              <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">{table.desc}</span>
            </div>

            {/* Fields list */}
            <div className="p-3 divide-y divide-slate-900 space-y-2 flex-grow">
              {table.fields.map((field, fIdx) => (
                <div key={fIdx} className="pt-2 first:pt-0 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[12px]">
                      {field.isPK && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                      {field.isFK && <Link2 className="w-3 h-3 text-teal-400 shrink-0" />}
                      <span className={field.isPK ? "text-amber-300 font-semibold" : field.isFK ? "text-teal-300" : "text-slate-200"}>
                        {field.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 rounded uppercase border border-slate-800/40">
                      {field.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 leading-normal italic pl-0.5">
                    {field.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer markers */}
            <div className="bg-slate-900/40 px-3 py-1.5 border-t border-slate-800/40 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Primary Key: PK</span>
              <span>Foreign Key: FK</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
