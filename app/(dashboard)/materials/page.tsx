'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { Material } from '@/types';

const FILE_TYPES = [
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'textbook', label: 'Textbook Chapter' },
  { value: 'notes', label: 'Study Notes' },
  { value: 'exam_paper', label: 'Exam Paper' },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('syllabus');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = () => {
    if (!user) return;
    setLoading(true);
    fetch('/api/materials', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((data) => setMaterials(data.materials || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchMaterials, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const form = new FormData();
    form.append('file', selectedFile);
    form.append('title', title || selectedFile.name);
    form.append('fileType', fileType);

    try {
      const r = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: { 'X-User-Id': user.id },
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Upload failed');
      setUploadSuccess(`"${data.material?.title}" uploaded and processed (${data.material?.chunkCount} chunks).`);
      setTitle('');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchMaterials();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this material and all associated data?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/materials/${id}`, { method: 'DELETE', headers: { 'X-User-Id': user.id } });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Study Materials</h1>
        <p className="text-sm text-slate-500 mt-1">Upload your syllabus, textbooks, notes, and past papers. The app extracts text, chunks it, and builds a RAG knowledge base.</p>
      </div>

      {/* Upload form */}
      <Card title="Upload Document">
        <CardBody>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS101 Python Syllabus"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF or TXT, max 10 MB)</label>
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-sm text-slate-500">Click to choose a PDF or TXT file</p>
                    <p className="text-xs text-slate-400 mt-1">Scanned image PDFs require OCR (not supported). Use text-searchable PDFs.</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            {uploadError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{uploadError}</div>}
            {uploadSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ {uploadSuccess}</div>}
            <Button type="submit" loading={uploading} disabled={!selectedFile} variant="primary">Upload & Process</Button>
          </form>
        </CardBody>
      </Card>

      {/* Materials list */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Your Documents ({materials.length})</h2>
        {loading ? (
          <LoadingSpinner message="Loading materials..." className="py-10" />
        ) : materials.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="No documents yet"
            description="Upload your first document to start building your knowledge base."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {materials.map((mat) => (
              <div key={mat.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{mat.title}</p>
                  <p className="text-xs text-slate-400 truncate">{mat.fileName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="info">{mat.fileType}</Badge>
                    <Badge variant={mat.status as any}>{mat.status}</Badge>
                    {mat.status === 'ready' && <span className="text-xs text-slate-400">{mat.chunkCount} chunks</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(mat.id)}
                  disabled={deleting === mat.id}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  title="Delete"
                >
                  {deleting === mat.id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
