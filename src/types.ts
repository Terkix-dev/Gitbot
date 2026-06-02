/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Repository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
}

export interface PRComment {
  id: number;
  repo_id: number;
  pr_id: number;
  file_path: string;
  line_number: number;
  author: string;
  content: string;
  created_at: string;
  is_ai?: boolean;
}

export interface PullRequest {
  id: number;
  repo_id: number;
  title: string;
  source_branch: string;
  target_branch: string;
  status: 'open' | 'closed' | 'merged';
}

export interface Pipeline {
  id: number;
  commit_sha: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  trigger_by: number;
  created_at: string;
}

export interface Job {
  id: number;
  pipeline_id: number;
  stage: 'lint' | 'test' | 'build' | 'deploy';
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  log_output: string;
}

export interface DiffLine {
  type: 'added' | 'deleted' | 'normal';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffFile {
  filePath: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

export interface RolloutPhase {
  phase: string;
  timeline: string;
  tasks: string[];
  details: string;
}
